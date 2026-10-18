'use client'

import { currentTranslate } from '@/shared/lib/i18n'
import { useCallback, useRef, useState } from 'react'
import { getClustersNear, type Coords3D, type RegionCliKey } from '@/entities/galaxy-data'
import {
  discoverClusters,
  type ClusterCandidate,
} from '@/features/farm-recommender/lib/discoverClusters'
import type { FarmSearchStatus, PadSize } from '@/features/farm-recommender/model/types'

export const DISCOVERY_RADIUS_LY = 15

export type ClusterDiscoveryParams = {
  regionKey: RegionCliKey
  padSize?: PadSize
  excludeSurface?: boolean
  center: Coords3D
  radiusLy: number
}

export type UseClusterDiscoveryResult = {
  status: FarmSearchStatus
  errorMessage: string | null
  candidates: ClusterCandidate[]
  discover: (params: ClusterDiscoveryParams) => Promise<void>
  reset: () => void
}

export function useClusterDiscovery(): UseClusterDiscoveryResult {
  const [status, setStatus] = useState<FarmSearchStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<ClusterCandidate[]>([])
  const runId = useRef(0)

  const discover = useCallback(async (params: ClusterDiscoveryParams) => {
    runId.current += 1
    const currentRun = runId.current

    setStatus('loading')
    setErrorMessage(null)

    try {
      const clusters = await getClustersNear(params.regionKey, params.center, params.radiusLy)
      if (runId.current !== currentRun) {
        return
      }

      const found = discoverClusters({
        clusters,
        padSize: params.padSize,
        excludeSurface: params.excludeSurface,
      })

      setCandidates(found)
      setStatus(found.length === 0 ? 'empty' : 'success')
    } catch (error) {
      if (runId.current !== currentRun) {
        return
      }

      setCandidates([])
      setErrorMessage(
        error instanceof Error && error.message.trim() !== ''
          ? error.message
          : currentTranslate()('clusters.scanFailed'),
      )
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    runId.current += 1
    setCandidates([])
    setErrorMessage(null)
    setStatus('idle')
  }, [])

  return { status, errorMessage, candidates, discover, reset }
}
