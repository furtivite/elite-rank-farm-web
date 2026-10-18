import {
  cellsForNames,
  findEntryByName,
  getIndexCell,
  getSystemsIndex,
  indexCellLy,
} from '@/entities/galaxy-data/api/snapshotFiles'
import type { CellAddress } from '@/entities/galaxy-data/lib/cells'
import type { Coords3D } from '@/entities/galaxy-data/lib/spatialSearch'
import type { RegionCliKey } from '@/entities/galaxy-data/model/types'

export async function resolveSystemCoords(
  regionKey: RegionCliKey,
  systemName: string,
): Promise<Coords3D | null> {
  const entry = await findEntryByName(regionKey, systemName)

  return entry === null ? null : { x: entry.x, y: entry.y, z: entry.z }
}

export async function getSystemCoordsByIds(
  regionKey: RegionCliKey,
  systems: readonly { id: string; name: string }[],
): Promise<Map<string, Coords3D>> {
  if (systems.length === 0) {
    return new Map()
  }

  const coords = new Map<string, Coords3D>()
  const cellLy = await indexCellLy(regionKey)

  if (cellLy !== null) {
    const names = await cellsForNames(
      regionKey,
      systems.map((system) => system.name),
    )
    const cells = new Set<string>()
    const byCell = new Map<string, CellAddress>()

    for (const system of systems) {
      const cell = names.get(system.name)
      if (cell !== undefined) {
        const key = cell.join('_')
        cells.add(key)
        byCell.set(key, cell)
      }
    }

    const loaded = await Promise.all(
      [...cells].map((key) => getIndexCell(regionKey, byCell.get(key) as CellAddress)),
    )
    const entryByName = new Map(loaded.flat().map((entry) => [entry.name, entry]))

    for (const system of systems) {
      const entry = entryByName.get(system.name)
      if (entry !== undefined) {
        coords.set(system.id, { x: entry.x, y: entry.y, z: entry.z })
      }
    }

    return coords
  }

  const wanted = new Set(systems.map((system) => system.id))
  for (const system of await getSystemsIndex(regionKey)) {
    if (wanted.has(system.id)) {
      coords.set(system.id, { x: system.x, y: system.y, z: system.z })
    }
  }

  return coords
}
