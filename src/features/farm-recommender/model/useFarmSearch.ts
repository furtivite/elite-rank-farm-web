import { currentTranslate } from '@/shared/lib/i18n'
import { useCallback, useState } from 'react'
import { searchFarmCandidates } from '@/features/farm-recommender/lib/searchFarmCandidates'
import type {
  FarmSearchParams,
  FarmSearchStatus,
  RawSystemGroup,
} from '@/features/farm-recommender/model/types'

export type UseFarmSearchResult = {
  status: FarmSearchStatus
  errorMessage: string | null
  groups: RawSystemGroup[]
  lastParams: FarmSearchParams | null
  search: (params: FarmSearchParams) => Promise<void>
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return currentTranslate()('results.failed')
}

export function useFarmSearch(): UseFarmSearchResult {
  const [status, setStatus] = useState<FarmSearchStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [groups, setGroups] = useState<RawSystemGroup[]>([])
  const [lastParams, setLastParams] = useState<FarmSearchParams | null>(null)

  const search = useCallback(async (params: FarmSearchParams) => {
    setStatus('loading')
    setErrorMessage(null)
    setLastParams(params)

    try {
      const result = await searchFarmCandidates(params)
      setGroups(result)
      setStatus(result.length === 0 ? 'empty' : 'success')
    } catch (error) {
      setGroups([])
      setErrorMessage(errorMessageFromUnknown(error))
      setStatus('error')
    }
  }, [])

  return { status, errorMessage, groups, lastParams, search }
}
