import type { StationRatingsMap } from '@/entities/station-rating/model/types'

export function mergeStationRatings(
  left: StationRatingsMap,
  right: StationRatingsMap,
): StationRatingsMap {
  const merged: StationRatingsMap = { ...left }

  for (const [stationId, entry] of Object.entries(right)) {
    const current = merged[stationId]

    if (current === undefined || entry.updatedAt > current.updatedAt) {
      merged[stationId] = entry
    }
  }

  return merged
}
