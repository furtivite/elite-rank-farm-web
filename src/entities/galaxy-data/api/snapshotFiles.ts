import { fetchJson } from '@/entities/galaxy-data/api/fetchJson'
import { nameBucket, type CellAddress } from '@/entities/galaxy-data/lib/cells'
import type {
  CachedSystem,
  RegionCliKey,
  RegionMeta,
  SystemIndexEntry,
} from '@/entities/galaxy-data/model/types'
import { withBasePath } from '@/shared/config/basePath'

const regionMetaCache = new Map<RegionCliKey, Promise<RegionMeta>>()
const systemsIndexCache = new Map<RegionCliKey, Promise<SystemIndexEntry[]>>()
const indexCellCache = new Map<string, Promise<SystemIndexEntry[]>>()
const namesCache = new Map<RegionCliKey, Promise<Map<string, CellAddress>>>()
const nameBucketCache = new Map<string, Promise<Map<string, CellAddress>>>()
const chunkCache = new Map<string, Promise<CachedSystem[]>>()

export function cellFileName(prefix: 'index' | 'clusters', cell: CellAddress): string {
  return `${prefix}/${prefix}_${cell[0]}_${cell[1]}_${cell[2]}.json`
}

export function dataUrl(path: string): string {
  return withBasePath(`/data/${path}`)
}

export function getRegionMeta(regionKey: RegionCliKey): Promise<RegionMeta> {
  let promise = regionMetaCache.get(regionKey)
  if (!promise) {
    promise = fetchJson<RegionMeta>(dataUrl(`${regionKey}/meta.json`))
    regionMetaCache.set(regionKey, promise)
  }
  return promise
}

export async function indexCellLy(regionKey: RegionCliKey): Promise<number | null> {
  try {
    const meta = await getRegionMeta(regionKey)
    return typeof meta.indexCellLy === 'number' && meta.indexCellLy > 0 ? meta.indexCellLy : null
  } catch {
    return null
  }
}

export function getIndexCell(
  regionKey: RegionCliKey,
  cell: CellAddress,
): Promise<SystemIndexEntry[]> {
  const cacheKey = `${regionKey}/${cell.join('_')}`
  let promise = indexCellCache.get(cacheKey)
  if (!promise) {
    promise = fetchJson<SystemIndexEntry[]>(
      dataUrl(`${regionKey}/${cellFileName('index', cell)}`),
    ).catch(() => [])
    indexCellCache.set(cacheKey, promise)
  }
  return promise
}

export function getNames(regionKey: RegionCliKey): Promise<Map<string, CellAddress>> {
  let promise = namesCache.get(regionKey)
  if (!promise) {
    promise = fetchJson<Record<string, [number, number, number]>>(
      dataUrl(`${regionKey}/names.json`),
    )
      .then((raw) => new Map<string, CellAddress>(Object.entries(raw)))
      .catch(() => new Map<string, CellAddress>())
    namesCache.set(regionKey, promise)
  }
  return promise
}

export function getNameBucket(
  regionKey: RegionCliKey,
  bucket: string,
): Promise<Map<string, CellAddress>> {
  const key = `${regionKey}/${bucket}`
  let promise = nameBucketCache.get(key)
  if (!promise) {
    promise = fetchJson<Record<string, [number, number, number]>>(
      dataUrl(`${regionKey}/names/names_${bucket}.json`),
    )
      .then((raw) => new Map<string, CellAddress>(Object.entries(raw)))
      .catch(() => new Map<string, CellAddress>())
    nameBucketCache.set(key, promise)
  }
  return promise
}

export async function cellsForNames(
  regionKey: RegionCliKey,
  names: readonly string[],
): Promise<Map<string, CellAddress>> {
  const meta = await getRegionMeta(regionKey).catch(() => null)
  const buckets = meta?.nameBucketCount

  if (buckets === undefined || buckets <= 0) {
    return getNames(regionKey)
  }

  const needed = new Set(names.map((name) => nameBucket(name, buckets)))
  const loaded = await Promise.all([...needed].map((bucket) => getNameBucket(regionKey, bucket)))

  const found = new Map<string, CellAddress>()
  for (const part of loaded) {
    for (const [name, cell] of part) {
      found.set(name, cell)
    }
  }

  return found
}

export async function findEntryByName(
  regionKey: RegionCliKey,
  systemName: string,
): Promise<SystemIndexEntry | null> {
  const cellLy = await indexCellLy(regionKey)

  if (cellLy !== null) {
    const cell = (await cellsForNames(regionKey, [systemName])).get(systemName)
    if (cell === undefined) {
      return null
    }
    const entries = await getIndexCell(regionKey, cell)
    return entries.find((entry) => entry.name === systemName) ?? null
  }

  const index = await getSystemsIndex(regionKey)
  return index.find((entry) => entry.name === systemName) ?? null
}

export function getSystemsIndex(regionKey: RegionCliKey): Promise<SystemIndexEntry[]> {
  let promise = systemsIndexCache.get(regionKey)
  if (!promise) {
    promise = fetchJson<SystemIndexEntry[]>(dataUrl(`${regionKey}/systems.json`))
    systemsIndexCache.set(regionKey, promise)
  }
  return promise
}

export function getChunk(regionKey: RegionCliKey, chunkPath: string): Promise<CachedSystem[]> {
  const cacheKey = `${regionKey}/${chunkPath}`
  let promise = chunkCache.get(cacheKey)
  if (!promise) {
    promise = fetchJson<CachedSystem[]>(dataUrl(`${regionKey}/${chunkPath}`))
    chunkCache.set(cacheKey, promise)
  }
  return promise
}

export function _resetSnapshotFileCaches(): void {
  regionMetaCache.clear()
  systemsIndexCache.clear()
  indexCellCache.clear()
  namesCache.clear()
  nameBucketCache.clear()
  chunkCache.clear()
}
