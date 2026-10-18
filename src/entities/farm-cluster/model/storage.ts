import { FARM_CLUSTERS_STORAGE_KEY } from '@/shared/config/storageKeys'
import { parseStoredClusters, serializeClusters } from '@/entities/farm-cluster/model/validate'
import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

export function loadClusters(): SavedFarmCluster[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = localStorage.getItem(FARM_CLUSTERS_STORAGE_KEY)
    if (raw === null) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    return parseStoredClusters(parsed)
  } catch {
    return []
  }
}

export function saveClusters(clusters: readonly SavedFarmCluster[]): void {
  try {
    localStorage.setItem(FARM_CLUSTERS_STORAGE_KEY, serializeClusters(clusters))
  } catch {
    return
  }
}
