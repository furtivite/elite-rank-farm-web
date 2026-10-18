import { useCallback, useSyncExternalStore } from 'react'
import {
  getClustersSnapshot,
  getServerClustersSnapshot,
  subscribeToClusters,
  writeClusters,
} from '@/entities/farm-cluster/model/store'
import {
  CLUSTER_NAME_MAX_LENGTH,
  type FarmClusterDraft,
  type SavedFarmCluster,
} from '@/entities/farm-cluster/model/types'

export type UseFarmClustersResult = {
  clusters: SavedFarmCluster[]
  saveCluster: (draft: FarmClusterDraft) => SavedFarmCluster
  renameCluster: (id: string, name: string) => void
  removeCluster: (id: string) => void
}

function newClusterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeName(name: string): string {
  return name.trim().slice(0, CLUSTER_NAME_MAX_LENGTH)
}

export function useFarmClusters(): UseFarmClustersResult {
  const clusters = useSyncExternalStore(
    subscribeToClusters,
    getClustersSnapshot,
    getServerClustersSnapshot,
  )

  const saveCluster = useCallback((draft: FarmClusterDraft): SavedFarmCluster => {
    const now = new Date().toISOString()
    const cluster: SavedFarmCluster = {
      id: newClusterId(),
      name: normalizeName(draft.name),
      region: draft.region,
      centerSystem: draft.centerSystem.trim(),
      radiusLy: draft.radiusLy,
      createdAt: now,
      updatedAt: now,
    }

    writeClusters([...getClustersSnapshot(), cluster])
    return cluster
  }, [])

  const renameCluster = useCallback((id: string, name: string) => {
    const next = normalizeName(name)
    if (next === '') {
      return
    }

    writeClusters(
      getClustersSnapshot().map((cluster) =>
        cluster.id === id
          ? { ...cluster, name: next, updatedAt: new Date().toISOString() }
          : cluster,
      ),
    )
  }, [])

  const removeCluster = useCallback((id: string) => {
    writeClusters(getClustersSnapshot().filter((cluster) => cluster.id !== id))
  }, [])

  return { clusters, saveCluster, renameCluster, removeCluster }
}
