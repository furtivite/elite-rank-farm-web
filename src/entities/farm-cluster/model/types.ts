import type { RegionCliKey } from '@/entities/galaxy-data'

export type SavedFarmCluster = {
  id: string
  name: string
  region: RegionCliKey
  centerSystem: string
  radiusLy: number
  createdAt: string
  updatedAt: string
}

export type FarmClusterDraft = {
  name: string
  region: RegionCliKey
  centerSystem: string
  radiusLy: number
}

export const CLUSTER_NAME_MAX_LENGTH = 60
