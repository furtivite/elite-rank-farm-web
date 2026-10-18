import { currentTranslate } from '@/shared/lib/i18n'
import { useCallback, useEffect, useState } from 'react'
import { useStationRatings } from '@/entities/station-rating'
import { loadBlockedBases } from '@/features/blocked-bases/lib/loadBlockedBases'
import type { BlockedBase, BlockedBasesStatus } from '@/features/blocked-bases/model/types'

export type UseBlockedBasesResult = {
  status: BlockedBasesStatus
  errorMessage: string | null
  bases: BlockedBase[]
  unblock: (stationId: string) => void
  setRating: (stationId: string, value: 'good' | 'bad') => void
  setNote: (stationId: string, note: string) => void
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return currentTranslate()('blocked.failed')
}

export function useBlockedBases(): UseBlockedBasesResult {
  const {
    ratings,
    setRating: setRatingValue,
    setNote: setNoteValue,
    rememberSystemIds,
  } = useStationRatings()
  const [bases, setBases] = useState<BlockedBase[]>([])
  const [status, setStatus] = useState<BlockedBasesStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadBlockedBases(ratings)
      .then((result) => {
        if (cancelled) {
          return
        }
        setBases(result.bases)
        setErrorMessage(null)
        setStatus('success')
        if (Object.keys(result.resolvedSystemIds).length > 0) {
          rememberSystemIds(result.resolvedSystemIds)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        setBases([])
        setErrorMessage(errorMessageFromUnknown(error))
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [ratings, rememberSystemIds])

  const unblock = useCallback(
    (stationId: string) => setRatingValue(stationId, undefined),
    [setRatingValue],
  )

  const setRating = useCallback(
    (stationId: string, value: 'good' | 'bad') => setRatingValue(stationId, value),
    [setRatingValue],
  )

  const setNote = useCallback(
    (stationId: string, note: string) => setNoteValue(stationId, note),
    [setNoteValue],
  )

  return { status, errorMessage, bases, unblock, setRating, setNote }
}
