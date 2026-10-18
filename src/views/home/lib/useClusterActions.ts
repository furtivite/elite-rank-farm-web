'use client'

import type { FarmClusterDraft, SavedFarmCluster } from '@/entities/farm-cluster'
import type {
  ClusterSearchMode,
  FarmMode,
  FarmSearchParams,
  UseClusterComparisonResult,
  UseClusterDiscoveryResult,
} from '@/features/farm-recommender'
import type { JumpOrigin } from '@/entities/mission-store'
import type { RegionCliKey } from '@/entities/galaxy-data'
import { resolveSearchRadius } from '@/shared/lib/searchRadius'

type ClusterActionsInput = {
  mode: FarmMode
  regionKey: RegionCliKey
  regionClusters: readonly SavedFarmCluster[]
  lastRequest: FarmSearchParams | null
  jumpOrigin: JumpOrigin | null
  jumpMultiplier: number
  discovery: UseClusterDiscoveryResult
  comparison: UseClusterComparisonResult
  saveCluster: (draft: FarmClusterDraft) => SavedFarmCluster
  setSelectedClusterId: (id: string | null) => void
  setClusterMode: (mode: ClusterSearchMode) => void
  search: (params: FarmSearchParams) => void | Promise<void>
}

export function useClusterActions({
  mode,
  regionKey,
  regionClusters,
  lastRequest,
  jumpOrigin,
  jumpMultiplier,
  discovery,
  comparison,
  saveCluster,
  setSelectedClusterId,
  setClusterMode,
  search,
}: ClusterActionsInput) {
  const discoverClusterCandidates = () => {
    if (jumpOrigin === null) {
      return
    }

    void discovery.discover({
      regionKey,
      padSize: lastRequest?.padSize,
      excludeSurface: lastRequest?.excludeSurface,
      center: jumpOrigin.coords,
      radiusLy: resolveSearchRadius(jumpOrigin.jumpRangeLy, jumpMultiplier, null).radiusLy,
    })
  }

  const saveDiscovered = (candidate: { centerSystem: string; radiusLy: number }) => {
    const saved = saveCluster({
      name: `${mode === 'empire' ? 'Imperial' : 'Federal'} — ${candidate.centerSystem} cluster`,
      region: regionKey,
      centerSystem: candidate.centerSystem,
      radiusLy: candidate.radiusLy,
    })
    setSelectedClusterId(saved.id)
  }

  const changeClusterMode = (next: ClusterSearchMode) => {
    setClusterMode(next)
    if (next !== 'better') {
      comparison.reset()
    }
  }

  const chooseCluster = (clusterId: string | null) => {
    setSelectedClusterId(clusterId)
    setClusterMode(clusterId === null ? 'auto' : 'stay')
    comparison.reset()

    if (lastRequest === null) {
      return
    }

    const cluster = regionClusters.find((entry) => entry.id === clusterId) ?? null
    void search({
      ...lastRequest,
      area:
        cluster === null
          ? undefined
          : { centerSystem: cluster.centerSystem, radiusLy: cluster.radiusLy },
    })
  }

  const clusterDraft: FarmClusterDraft | null =
    lastRequest === null
      ? null
      : {
          name: `${mode === 'empire' ? 'Imperial' : 'Federal'} — ${lastRequest.area?.centerSystem ?? lastRequest.currentSystem.name} cluster`,
          region: regionKey,
          centerSystem: lastRequest.area?.centerSystem ?? lastRequest.currentSystem.name,
          radiusLy: lastRequest.area?.radiusLy ?? lastRequest.jumpRangeLy,
        }

  return {
    discoverClusterCandidates,
    saveDiscovered,
    changeClusterMode,
    chooseCluster,
    clusterDraft,
  }
}
