import type {
  StationRatingEntry,
  StationRatingsMap,
  StationRatingValue,
} from '@/entities/station-rating/model/types'

const STATION_RATING_STORAGE_VERSION = 1

const KNOWN_RATING_VALUES: readonly StationRatingValue[] = ['good', 'bad', 'blocked']

function isStationRatingEntry(value: unknown): value is StationRatingEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>

  if (
    record.rating !== undefined &&
    !KNOWN_RATING_VALUES.includes(record.rating as StationRatingValue)
  ) {
    return false
  }
  if (
    record.missionCount !== undefined &&
    (typeof record.missionCount !== 'number' ||
      !Number.isFinite(record.missionCount) ||
      record.missionCount < 0)
  ) {
    return false
  }
  if (typeof record.updatedAt !== 'string') {
    return false
  }
  if (record.blockedAt !== undefined && typeof record.blockedAt !== 'string') {
    return false
  }
  if (record.note !== undefined && typeof record.note !== 'string') {
    return false
  }
  if (record.systemName !== undefined && typeof record.systemName !== 'string') {
    return false
  }
  if (record.systemId !== undefined && typeof record.systemId !== 'string') {
    return false
  }

  return true
}

export function parseStationRatingEntries(value: unknown): StationRatingsMap {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  const result: StationRatingsMap = {}
  for (const [stationId, entry] of Object.entries(value as Record<string, unknown>)) {
    if (isStationRatingEntry(entry)) {
      result[stationId] = entry
    }
  }

  return result
}

export function parseStoredStationRatings(value: unknown): StationRatingsMap {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  const record = value as Record<string, unknown>

  if (record.version !== STATION_RATING_STORAGE_VERSION) {
    return {}
  }

  return parseStationRatingEntries(record.entries)
}

export function serializeStationRatings(ratings: StationRatingsMap): string {
  return JSON.stringify({ version: STATION_RATING_STORAGE_VERSION, entries: ratings })
}
