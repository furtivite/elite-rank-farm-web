'use client'

import {
  fetchStationRatings,
  forgetStationRating,
  getRatingsSnapshot,
  mergeStationRatings,
  saveStationRatings,
  subscribeToForgottenStations,
  subscribeToRatings,
  writeRatings,
  type StationRatingsMap,
} from '@/entities/station-rating'
import { useAccountSync } from '@/shared/lib/accountSync'

export function useStationRatingsSync(isSignedIn: boolean): void {
  useAccountSync<StationRatingsMap>(isSignedIn, {
    fetchRemote: async () => {
      const result = await fetchStationRatings()

      return result.status === 'success'
        ? { status: 'success', items: result.entries }
        : { status: result.status }
    },
    saveRemote: saveStationRatings,
    forgetRemote: async (stationIds) => {
      let latest: StationRatingsMap | null = null
      for (const stationId of stationIds) {
        latest = (await forgetStationRating(stationId)) ?? latest
      }

      return latest
    },
    readLocal: getRatingsSnapshot,
    writeLocal: writeRatings,
    subscribeLocal: subscribeToRatings,
    subscribeForgotten: (listener) => subscribeToForgottenStations((id) => listener([id])),
    merge: mergeStationRatings,
    same: sameRatings,
  })
}

function sameRatings(left: StationRatingsMap, right: StationRatingsMap): boolean {
  const leftKeys = Object.keys(left)
  if (leftKeys.length !== Object.keys(right).length) {
    return false
  }

  return leftKeys.every((stationId) => left[stationId]?.updatedAt === right[stationId]?.updatedAt)
}
