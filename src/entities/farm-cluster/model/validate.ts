import type { RegionCliKey } from '@/entities/galaxy-data'
import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

const FARM_CLUSTER_STORAGE_VERSION = 1

const KNOWN_REGIONS: readonly RegionCliKey[] = ['imperial', 'federal']

function isSavedFarmCluster(value: unknown): value is SavedFarmCluster {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>

  if (typeof record.id !== 'string' || record.id === '') {
    return false
  }
  if (typeof record.name !== 'string' || record.name.trim() === '') {
    return false
  }
  if (!KNOWN_REGIONS.includes(record.region as RegionCliKey)) {
    return false
  }
  if (typeof record.centerSystem !== 'string' || record.centerSystem.trim() === '') {
    return false
  }
  if (
    typeof record.radiusLy !== 'number' ||
    !Number.isFinite(record.radiusLy) ||
    record.radiusLy <= 0
  ) {
    return false
  }
  if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
    return false
  }

  return true
}

export function parseClusterList(value: unknown): SavedFarmCluster[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: SavedFarmCluster[] = []
  for (const entry of value) {
    if (isSavedFarmCluster(entry)) {
      result.push({
        id: entry.id,
        name: entry.name,
        region: entry.region,
        centerSystem: entry.centerSystem,
        radiusLy: entry.radiusLy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })
    }
  }

  return result
}

export function parseStoredClusters(value: unknown): SavedFarmCluster[] {
  if (typeof value !== 'object' || value === null) {
    return []
  }
  const record = value as Record<string, unknown>

  if (record.version !== FARM_CLUSTER_STORAGE_VERSION) {
    return []
  }

  return parseClusterList(record.clusters)
}

export function serializeClusters(clusters: readonly SavedFarmCluster[]): string {
  return JSON.stringify({ version: FARM_CLUSTER_STORAGE_VERSION, clusters })
}
