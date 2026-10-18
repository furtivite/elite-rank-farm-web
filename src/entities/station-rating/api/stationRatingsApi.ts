import { withBasePath } from '@/shared/config/basePath'
import { parseStationRatingEntries } from '@/entities/station-rating/model/validate'
import type { StationRatingsMap } from '@/entities/station-rating/model/types'

export type FetchStationRatingsResult =
  | { status: 'success'; entries: StationRatingsMap }
  | { status: 'guest' }
  | { status: 'unavailable' }

const URL = withBasePath('/api/account/station-ratings')

function parse(payload: unknown): StationRatingsMap {
  if (typeof payload !== 'object' || payload === null) {
    return {}
  }

  return parseStationRatingEntries((payload as { entries?: unknown }).entries)
}

export async function fetchStationRatings(): Promise<FetchStationRatingsResult> {
  let response: Response
  try {
    response = await fetch(URL, { credentials: 'include', cache: 'no-store' })
  } catch {
    return { status: 'unavailable' }
  }

  if (response.status === 401) {
    return { status: 'guest' }
  }
  if (!response.ok) {
    return { status: 'unavailable' }
  }

  try {
    return { status: 'success', entries: parse(await response.json()) }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function saveStationRatings(
  entries: StationRatingsMap,
): Promise<StationRatingsMap | null> {
  try {
    const response = await fetch(URL, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })

    return response.ok ? parse(await response.json()) : null
  } catch {
    return null
  }
}

export async function forgetStationRating(stationId: string): Promise<StationRatingsMap | null> {
  try {
    const response = await fetch(`${URL}?stationId=${encodeURIComponent(stationId)}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    return response.ok ? parse(await response.json()) : null
  } catch {
    return null
  }
}
