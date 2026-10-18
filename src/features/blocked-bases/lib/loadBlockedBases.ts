import { getRegionSystemsForLegacyLookup, getSystemsByIds } from '@/entities/galaxy-data'
import type { CachedSystem, RegionCliKey } from '@/entities/galaxy-data'
import type { StationRatingsMap } from '@/entities/station-rating'
import type { BlockedBase } from '@/features/blocked-bases/model/types'

const REGION_KEYS: readonly RegionCliKey[] = ['galaxy']

export type LoadBlockedBasesResult = {
  bases: BlockedBase[]
  resolvedSystemIds: Record<string, { systemId: string; systemName: string }>
}

export async function loadBlockedBases(
  ratings: StationRatingsMap,
): Promise<LoadBlockedBasesResult> {
  const blocked = Object.entries(ratings).filter(([, entry]) => entry.rating === 'blocked')

  if (blocked.length === 0) {
    return { bases: [], resolvedSystemIds: {} }
  }

  const blockedIds = new Set(blocked.map(([stationId]) => stationId))

  const known = new Map<string, { id: string; name: string }>()
  for (const [, entry] of blocked) {
    if (entry.systemId !== undefined && entry.systemName !== undefined) {
      known.set(entry.systemId, { id: entry.systemId, name: entry.systemName })
    }
  }

  const needsLegacyScan = blocked.some(
    ([, entry]) => entry.systemId === undefined || entry.systemName === undefined,
  )

  const perRegion = await Promise.all(
    REGION_KEYS.map(async (regionKey): Promise<[RegionCliKey, CachedSystem[]]> => {
      const byPointer = await getSystemsByIds(regionKey, [...known.values()])
      if (!needsLegacyScan) {
        return [regionKey, byPointer]
      }

      const scanned = await getRegionSystemsForLegacyLookup(regionKey)
      const merged = new Map(byPointer.map((system) => [system.id, system]))
      for (const system of scanned) {
        merged.set(system.id, system)
      }
      return [regionKey, [...merged.values()]]
    }),
  )

  const bases: BlockedBase[] = []
  const resolvedSystemIds: Record<string, { systemId: string; systemName: string }> = {}

  for (const [regionKey, systems] of perRegion) {
    for (const system of systems) {
      for (const station of system.stations) {
        if (!blockedIds.has(station.id)) {
          continue
        }

        const entry = ratings[station.id]
        if (entry?.systemId === undefined || entry.systemName === undefined) {
          resolvedSystemIds[station.id] = { systemId: system.id, systemName: system.name }
        }

        bases.push({
          station,
          systemId: system.id,
          systemName: system.name,
          systemFactionSummary: system.systemFactionSummary,
          systemFactions: system.systemFactions,
          regionKey,
          blockedAt: entry?.blockedAt,
          note: entry?.note,
        })
      }
    }
  }

  return { bases, resolvedSystemIds }
}
