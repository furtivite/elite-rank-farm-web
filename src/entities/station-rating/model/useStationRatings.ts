import { useCallback, useSyncExternalStore } from 'react'
import {
  getRatingsSnapshot,
  getServerRatingsSnapshot,
  notifyStationForgotten,
  subscribeToRatings,
  writeRatings,
} from '@/entities/station-rating/model/store'
import type { StationRatingsMap, StationRatingValue } from '@/entities/station-rating/model/types'

export type UseStationRatingsResult = {
  ratings: StationRatingsMap
  setRating: (
    stationId: string,
    value: StationRatingValue | undefined,
    systemId?: string,
    systemName?: string,
  ) => void
  setNote: (stationId: string, note: string) => void
  resetStation: (stationId: string) => void
  rememberSystemIds: (
    places: Readonly<Record<string, { systemId: string; systemName: string }>>,
  ) => void
}

export function useStationRatings(): UseStationRatingsResult {
  const ratings = useSyncExternalStore(
    subscribeToRatings,
    getRatingsSnapshot,
    getServerRatingsSnapshot,
  )

  const setRating = useCallback(
    (
      stationId: string,
      value: StationRatingValue | undefined,
      systemId?: string,
      systemName?: string,
    ) => {
      const current = getRatingsSnapshot()
      const existing = current[stationId]
      writeRatings({
        ...current,
        [stationId]: {
          rating: value,
          missionCount: existing?.missionCount,
          note: existing?.note,
          systemId: systemId ?? existing?.systemId,
          systemName: systemName ?? existing?.systemName,
          blockedAt:
            value === 'blocked' ? (existing?.blockedAt ?? new Date().toISOString()) : undefined,
          updatedAt: new Date().toISOString(),
        },
      })
    },
    [],
  )

  const setNote = useCallback((stationId: string, note: string) => {
    const current = getRatingsSnapshot()
    const existing = current[stationId]
    const trimmed = note.trim()
    writeRatings({
      ...current,
      [stationId]: {
        rating: existing?.rating,
        missionCount: existing?.missionCount,
        note: trimmed === '' ? undefined : trimmed,
        blockedAt: existing?.blockedAt,
        systemId: existing?.systemId,
        systemName: existing?.systemName,
        updatedAt: new Date().toISOString(),
      },
    })
  }, [])

  const rememberSystemIds = useCallback(
    (places: Readonly<Record<string, { systemId: string; systemName: string }>>) => {
      const current = getRatingsSnapshot()
      const next = { ...current }
      let changed = false

      for (const [stationId, place] of Object.entries(places)) {
        const existing = current[stationId]
        if (existing === undefined) {
          continue
        }
        if (existing.systemId !== undefined && existing.systemName !== undefined) {
          continue
        }
        next[stationId] = {
          ...existing,
          systemId: existing.systemId ?? place.systemId,
          systemName: existing.systemName ?? place.systemName,
        }
        changed = true
      }

      if (changed) {
        writeRatings(next)
      }
    },
    [],
  )

  const resetStation = useCallback((stationId: string) => {
    const next = { ...getRatingsSnapshot() }
    delete next[stationId]
    writeRatings(next)
    notifyStationForgotten(stationId)
  }, [])

  return { ratings, setRating, setNote, resetStation, rememberSystemIds }
}
