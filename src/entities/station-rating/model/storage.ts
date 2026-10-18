import { STATION_RATINGS_STORAGE_KEY } from '@/shared/config/storageKeys'
import {
  parseStoredStationRatings,
  serializeStationRatings,
} from '@/entities/station-rating/model/validate'
import type { StationRatingsMap } from '@/entities/station-rating/model/types'

export function loadStationRatings(): StationRatingsMap {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = localStorage.getItem(STATION_RATINGS_STORAGE_KEY)
    if (raw === null) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)
    return parseStoredStationRatings(parsed)
  } catch {
    return {}
  }
}

export function saveStationRatings(ratings: StationRatingsMap): void {
  try {
    localStorage.setItem(STATION_RATINGS_STORAGE_KEY, serializeStationRatings(ratings))
  } catch {
    return
  }
}

export function clearStationRatings(): void {
  try {
    localStorage.removeItem(STATION_RATINGS_STORAGE_KEY)
  } catch {
    return
  }
}
