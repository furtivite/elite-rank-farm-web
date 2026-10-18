import { fetchJson } from '@/entities/galaxy-data/api/fetchJson'
import { withBasePath } from '@/shared/config/basePath'
import { cellsAround, type CellAddress } from '@/entities/galaxy-data/lib/cells'
import type { StarLayer, StarLayerEntry } from '@/entities/galaxy-data/lib/jumpGraph'
import type { Coords3D } from '@/entities/galaxy-data/lib/spatialSearch'
import type { RegionCliKey } from '@/entities/galaxy-data/model/types'

type StarLayerMeta = {
  schemaVersion: number
  regionId: string
  cellLy: number
  count: number
}

const wholeLayerCache = new Map<RegionCliKey, Promise<StarLayer>>()
const metaCache = new Map<RegionCliKey, Promise<StarLayerMeta | null>>()
const cellCache = new Map<string, Promise<StarLayerEntry[]>>()

function starsUrl(path: string): string {
  return withBasePath(`/stars/${path}`)
}

function cellFileName(cell: CellAddress): string {
  return `cells/cell_${cell[0]}_${cell[1]}_${cell[2]}.json`
}

function getMeta(regionKey: RegionCliKey): Promise<StarLayerMeta | null> {
  let promise = metaCache.get(regionKey)
  if (!promise) {
    promise = fetchJson<StarLayerMeta>(starsUrl(`${regionKey}/meta.json`))
      .then((meta) => (typeof meta.cellLy === 'number' && meta.cellLy > 0 ? meta : null))
      .catch(() => null)
    metaCache.set(regionKey, promise)
  }
  return promise
}

function getCell(regionKey: RegionCliKey, cell: CellAddress): Promise<StarLayerEntry[]> {
  const key = `${regionKey}/${cell.join('_')}`
  let promise = cellCache.get(key)
  if (!promise) {
    promise = fetchJson<StarLayerEntry[]>(starsUrl(`${regionKey}/${cellFileName(cell)}`)).catch(
      () => [],
    )
    cellCache.set(key, promise)
  }
  return promise
}

function getWholeLayer(regionKey: RegionCliKey): Promise<StarLayer> {
  let promise = wholeLayerCache.get(regionKey)
  if (!promise) {
    promise = fetchJson<StarLayer>(starsUrl(`${regionKey}.json`))
    wholeLayerCache.set(regionKey, promise)
  }
  return promise
}

export async function getStarLayerNear(
  regionKey: RegionCliKey,
  center: Coords3D,
  radiusLy: number,
): Promise<StarLayer> {
  const meta = await getMeta(regionKey)
  if (meta === null) {
    return getWholeLayer(regionKey)
  }

  const cells = cellsAround(center, radiusLy, meta.cellLy)
  const systems = (await Promise.all(cells.map((cell) => getCell(regionKey, cell)))).flat()

  return {
    regionId: meta.regionId,
    radiusLy,
    count: systems.length,
    systems,
  }
}

export function _resetStarLayerCacheForTests(): void {
  wholeLayerCache.clear()
  metaCache.clear()
  cellCache.clear()
}
