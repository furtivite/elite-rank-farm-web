import {
  fetchSystemSnapshot,
  type FetchSystemSnapshotResult,
} from '@/entities/galaxy-data/api/fetchSystemSnapshot'
import {
  cellsForNames,
  findEntryByName,
  getChunk,
  getIndexCell,
  getSystemsIndex,
  indexCellLy,
  _resetSnapshotFileCaches,
} from '@/entities/galaxy-data/api/snapshotFiles'
import { _resetClusterCaches } from '@/entities/galaxy-data/api/clusterFiles'
import { cellsAround, type CellAddress } from '@/entities/galaxy-data/lib/cells'
import {
  findSystemsWithinRadius,
  type Coords3D,
  type ReachableSystem,
} from '@/entities/galaxy-data/lib/spatialSearch'
import type {
  CachedStation,
  CachedSystem,
  RegionCliKey,
  SystemIndexEntry,
} from '@/entities/galaxy-data/model/types'

const systemOverrides = new Map<string, CachedSystem>()

export {
  getRegionMeta,
  findEntryByName,
  getChunk,
  getSystemsIndex,
} from '@/entities/galaxy-data/api/snapshotFiles'
export { getClustersNear, getRegionClusters } from '@/entities/galaxy-data/api/clusterFiles'
export { searchSystemsByName } from '@/entities/galaxy-data/api/nameSearch'
export { getSystemCoordsByIds, resolveSystemCoords } from '@/entities/galaxy-data/api/systemCoords'

export async function getSystemsInRadius(
  regionKey: RegionCliKey,
  center: Coords3D,
  radiusLy: number,
): Promise<ReachableSystem[]> {
  const cellLy = await indexCellLy(regionKey)
  const index =
    cellLy === null
      ? await getSystemsIndex(regionKey)
      : (
          await Promise.all(
            cellsAround(center, radiusLy, cellLy).map((cell) => getIndexCell(regionKey, cell)),
          )
        ).flat()

  return findSystemsWithinRadius(index, center, radiusLy)
}

export async function getSystem(
  regionKey: RegionCliKey,
  systemName: string,
): Promise<CachedSystem | null> {
  const entry = await findEntryByName(regionKey, systemName)
  if (!entry) {
    return null
  }

  const fresh = systemOverrides.get(entry.id)
  if (fresh) {
    return fresh
  }

  const chunk = await getChunk(regionKey, entry.chunk)
  return chunk.find((system) => system.id === entry.id) ?? null
}

export async function loadSystemsForEntries(
  regionKey: RegionCliKey,
  entries: readonly SystemIndexEntry[],
): Promise<CachedSystem[]> {
  if (entries.length === 0) {
    return []
  }

  const wanted = new Set(entries.map((entry) => entry.id))
  const chunkPaths = Array.from(new Set(entries.map((entry) => entry.chunk)))
  const chunks = await Promise.all(chunkPaths.map((chunkPath) => getChunk(regionKey, chunkPath)))

  const result: CachedSystem[] = []
  for (const system of chunks.flat()) {
    if (!wanted.has(system.id)) {
      continue
    }
    result.push(systemOverrides.get(system.id) ?? system)
  }

  return result
}

export async function getRegionSystemsForLegacyLookup(
  regionKey: RegionCliKey,
): Promise<CachedSystem[]> {
  if ((await indexCellLy(regionKey)) !== null) {
    return []
  }

  const index = await getSystemsIndex(regionKey)
  return loadSystemsForEntries(regionKey, index)
}

export async function getSystemsByIds(
  regionKey: RegionCliKey,
  systems: readonly { id: string; name: string }[],
): Promise<CachedSystem[]> {
  if (systems.length === 0) {
    return []
  }

  const cellLy = await indexCellLy(regionKey)

  if (cellLy !== null) {
    const names = await cellsForNames(
      regionKey,
      systems.map((system) => system.name),
    )
    const cells = new Map<string, CellAddress>()
    for (const system of systems) {
      const cell = names.get(system.name)
      if (cell !== undefined) {
        cells.set(cell.join('_'), cell)
      }
    }

    const wantedNames = new Set(systems.map((system) => system.name))
    const entries = (
      await Promise.all([...cells.values()].map((cell) => getIndexCell(regionKey, cell)))
    )
      .flat()
      .filter((entry) => wantedNames.has(entry.name))

    return loadSystemsForEntries(regionKey, entries)
  }

  const wanted = new Set(systems.map((system) => system.id))
  const index = await getSystemsIndex(regionKey)
  return loadSystemsForEntries(
    regionKey,
    index.filter((entry) => wanted.has(entry.id)),
  )
}

export async function getSystemsWithStationsInRadius(
  regionKey: RegionCliKey,
  center: Coords3D,
  radiusLy: number,
): Promise<CachedSystem[]> {
  return loadSystemsForEntries(regionKey, await getSystemsInRadius(regionKey, center, radiusLy))
}

export async function getStations(
  regionKey: RegionCliKey,
  system: { id: string; name: string },
): Promise<CachedStation[]> {
  const fresh = systemOverrides.get(system.id)
  if (fresh) {
    return fresh.stations
  }

  const entry = await findEntryByName(regionKey, system.name)
  if (!entry) {
    return []
  }

  const chunk = await getChunk(regionKey, entry.chunk)
  return chunk.find((found) => found.id === system.id)?.stations ?? []
}

export async function refreshSystem(systemId: string): Promise<FetchSystemSnapshotResult> {
  const result = await fetchSystemSnapshot(systemId)
  if (result.status === 'success') {
    systemOverrides.set(result.system.id, result.system)
  }

  return result
}

export function _resetGalaxyDataProviderCacheForTests(): void {
  _resetSnapshotFileCaches()
  _resetClusterCaches()
  systemOverrides.clear()
}
