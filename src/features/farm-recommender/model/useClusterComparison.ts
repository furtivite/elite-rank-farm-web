'use client'

import { currentTranslate } from '@/shared/lib/i18n'
import { useCallback, useRef, useState } from 'react'
import type { SavedFarmCluster } from '@/entities/farm-cluster'
import { searchFarmCandidates } from '@/features/farm-recommender/lib/searchFarmCandidates'
import type { ClusterSearchResult } from '@/features/farm-recommender/lib/rankClusters'
import type { FarmSearchParams, FarmSearchStatus } from '@/features/farm-recommender/model/types'

export const AUTO_DISCOVERY_LABEL = 'Auto discovery'

export type UseClusterComparisonResult = {
  status: FarmSearchStatus
  errorMessage: string | null
  results: ClusterSearchResult[]
  compare: (params: FarmSearchParams, clusters: readonly SavedFarmCluster[]) => Promise<void>
  reset: () => void
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return currentTranslate()('clusters.comparisonFailed')
}

export function useClusterComparison(): UseClusterComparisonResult {
  const [status, setStatus] = useState<FarmSearchStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [results, setResults] = useState<ClusterSearchResult[]>([])
  const runId = useRef(0)

  const compare = useCallback(
    async (params: FarmSearchParams, clusters: readonly SavedFarmCluster[]) => {
      runId.current += 1
      const currentRun = runId.current

      setStatus('loading')
      setErrorMessage(null)

      const candidates: { clusterId: string | null; name: string; params: FarmSearchParams }[] = [
        { clusterId: null, name: AUTO_DISCOVERY_LABEL, params: { ...params, area: undefined } },
        ...clusters.map((cluster) => ({
          clusterId: cluster.id,
          name: cluster.name,
          params: {
            ...params,
            area: { centerSystem: cluster.centerSystem, radiusLy: cluster.radiusLy },
          },
        })),
      ]

      try {
        const groups = await Promise.all(
          candidates.map((candidate) => searchFarmCandidates(candidate.params)),
        )
        if (runId.current !== currentRun) {
          return
        }

        const next = candidates.map((candidate, index) => ({
          clusterId: candidate.clusterId,
          name: candidate.name,
          groups: groups[index],
        }))

        setResults(next)
        setStatus(next.every((entry) => entry.groups.length === 0) ? 'empty' : 'success')
      } catch (error) {
        if (runId.current !== currentRun) {
          return
        }

        setResults([])
        setErrorMessage(errorMessageFromUnknown(error))
        setStatus('error')
      }
    },
    [],
  )

  const reset = useCallback(() => {
    runId.current += 1
    setResults([])
    setErrorMessage(null)
    setStatus('idle')
  }, [])

  return { status, errorMessage, results, compare, reset }
}
