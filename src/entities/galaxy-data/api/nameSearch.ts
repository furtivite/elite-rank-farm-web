import {
  getIndexCell,
  getNames,
  getSystemsIndex,
  indexCellLy,
} from '@/entities/galaxy-data/api/snapshotFiles'
import type { CellAddress } from '@/entities/galaxy-data/lib/cells'
import type { RegionCliKey, SystemIndexEntry } from '@/entities/galaxy-data/model/types'

export async function searchSystemsByName(
  regionKey: RegionCliKey,
  query: string,
  limit = 8,
): Promise<SystemIndexEntry[]> {
  const needle = query.trim().toLowerCase()
  if (needle === '') {
    return []
  }

  const cellLy = await indexCellLy(regionKey)
  if (cellLy !== null) {
    return searchByNamesDictionary(regionKey, needle, limit)
  }

  const index = await getSystemsIndex(regionKey)
  const startsWith: SystemIndexEntry[] = []
  const contains: SystemIndexEntry[] = []

  for (const entry of index) {
    const name = entry.name.toLowerCase()
    if (name.startsWith(needle)) {
      startsWith.push(entry)
    } else if (name.includes(needle)) {
      contains.push(entry)
    }
    if (startsWith.length >= limit) {
      break
    }
  }

  return [...startsWith, ...contains].slice(0, limit)
}

async function searchByNamesDictionary(
  regionKey: RegionCliKey,
  needle: string,
  limit: number,
): Promise<SystemIndexEntry[]> {
  const names = await getNames(regionKey)
  const startsWith: string[] = []
  const contains: string[] = []

  for (const name of names.keys()) {
    const lower = name.toLowerCase()
    if (lower.startsWith(needle)) {
      startsWith.push(name)
      if (startsWith.length >= limit) {
        break
      }
    } else if (contains.length < limit && lower.includes(needle)) {
      contains.push(name)
    }
  }

  const picked = [...startsWith, ...contains].slice(0, limit)
  if (picked.length === 0) {
    return []
  }

  const cells = new Map<string, CellAddress>()
  for (const name of picked) {
    const cell = names.get(name)
    if (cell !== undefined) {
      cells.set(cell.join('_'), cell)
    }
  }

  const entryByName = new Map(
    (await Promise.all([...cells.values()].map((cell) => getIndexCell(regionKey, cell))))
      .flat()
      .map((entry) => [entry.name, entry] as const),
  )

  const found: SystemIndexEntry[] = []
  for (const name of picked) {
    const entry = entryByName.get(name)
    if (entry !== undefined) {
      found.push(entry)
    }
  }

  return found
}
