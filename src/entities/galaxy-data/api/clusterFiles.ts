import { cellFileName, dataUrl, getRegionMeta } from '@/entities/galaxy-data/api/snapshotFiles'
import { fetchJson } from '@/entities/galaxy-data/api/fetchJson'
import { cellsAround, type CellAddress } from '@/entities/galaxy-data/lib/cells'
import type { Coords3D } from '@/entities/galaxy-data/lib/spatialSearch'
import type { RegionClusters, RegionCliKey } from '@/entities/galaxy-data/model/types'

const clusterCellCache = new Map<string, Promise<RegionClusters['candidates']>>()
const clustersCache = new Map<RegionCliKey, Promise<RegionClusters>>()

export async function getClustersNear(
  regionKey: RegionCliKey,
  center: Coords3D,
  radiusLy: number,
): Promise<RegionClusters> {
  const meta = await getRegionMeta(regionKey).catch(() => null)
  const cellLy = meta?.indexCellLy ?? null

  if (
    cellLy === null ||
    meta?.clusterRadiusLy === undefined ||
    meta.clusterNearStarLs === undefined
  ) {
    const document = await getRegionClusters(regionKey)
    return { ...document, candidates: candidatesWithin(document.candidates, center, radiusLy) }
  }

  const cells = await Promise.all(
    cellsAround(center, radiusLy, cellLy).map((cell) => getClusterCell(regionKey, cell)),
  )

  return {
    schemaVersion: 1,
    generatedAt: meta.generatedAt,
    regionId: meta.regionId,
    radiusLy: meta.clusterRadiusLy,
    nearStarLs: meta.clusterNearStarLs,
    candidates: candidatesWithin(cells.flat(), center, radiusLy),
  }
}

function candidatesWithin<T extends Coords3D>(
  candidates: readonly T[],
  center: Coords3D,
  radiusLy: number,
): T[] {
  const limit = radiusLy * radiusLy

  return candidates.filter((candidate) => {
    const dx = candidate.x - center.x
    const dy = candidate.y - center.y
    const dz = candidate.z - center.z

    return dx * dx + dy * dy + dz * dz <= limit
  })
}

function getClusterCell(
  regionKey: RegionCliKey,
  cell: CellAddress,
): Promise<RegionClusters['candidates']> {
  const cacheKey = `${regionKey}/clusters/${cell.join('_')}`
  let promise = clusterCellCache.get(cacheKey)
  if (!promise) {
    promise = fetchJson<RegionClusters['candidates']>(
      dataUrl(`${regionKey}/${cellFileName('clusters', cell)}`),
    ).catch(() => [])
    clusterCellCache.set(cacheKey, promise)
  }
  return promise
}

export function getRegionClusters(regionKey: RegionCliKey): Promise<RegionClusters> {
  let promise = clustersCache.get(regionKey)
  if (!promise) {
    promise = fetchJson<RegionClusters>(dataUrl(`${regionKey}/clusters.json`))
    clustersCache.set(regionKey, promise)
  }
  return promise
}

export function _resetClusterCaches(): void {
  clusterCellCache.clear()
  clustersCache.clear()
}
