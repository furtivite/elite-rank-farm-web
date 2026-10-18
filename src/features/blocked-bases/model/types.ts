import type {
  CachedStation,
  RegionCliKey,
  StationFaction,
  StationFactionSummary,
} from '@/entities/galaxy-data'

export type BlockedBase = {
  station: CachedStation
  systemId: string
  systemName: string
  systemFactionSummary: StationFactionSummary
  systemFactions: StationFaction[]
  regionKey: RegionCliKey
  blockedAt: string | undefined
  note: string | undefined
}

export type BlockedBasesStatus = 'idle' | 'loading' | 'success' | 'error'
