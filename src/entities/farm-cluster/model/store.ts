import { loadClusters, saveClusters } from '@/entities/farm-cluster/model/storage'
import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

const EMPTY: SavedFarmCluster[] = []

let snapshot: SavedFarmCluster[] = EMPTY
let initialized = false

const listeners = new Set<() => void>()

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = loadClusters()
}

export function getClustersSnapshot(): SavedFarmCluster[] {
  ensureInitialized()
  return snapshot
}

export function getServerClustersSnapshot(): SavedFarmCluster[] {
  return EMPTY
}

export function subscribeToClusters(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const forgetListeners = new Set<(clusterIds: readonly string[]) => void>()

export function subscribeToForgottenClusters(
  listener: (clusterIds: readonly string[]) => void,
): () => void {
  forgetListeners.add(listener)
  return () => {
    forgetListeners.delete(listener)
  }
}

export function writeClusters(next: SavedFarmCluster[]): void {
  ensureInitialized()
  const before = snapshot
  snapshot = next
  saveClusters(next)

  if (before.length > 0) {
    const remaining = new Set(next.map((cluster) => cluster.id))
    const gone = before.filter((cluster) => !remaining.has(cluster.id)).map((cluster) => cluster.id)

    if (gone.length > 0) {
      for (const listener of forgetListeners) {
        listener(gone)
      }
    }
  }

  for (const listener of listeners) {
    listener()
  }
}
