import type {
  CachedStation,
  Coords3D,
  DataSource,
  RegionCliKey,
  StationFactionSummary,
} from '@/entities/galaxy-data'
import type { StationRatingValue } from '@/entities/station-rating'

export type FarmMode = 'empire' | 'federal'

export const FARM_MODE_TO_REGION = {
  empire: 'galaxy',
  federal: 'galaxy',
} satisfies Record<FarmMode, RegionCliKey>

export type FarmRegionKey = (typeof FARM_MODE_TO_REGION)[FarmMode]

export type PadSize = 'S' | 'M' | 'L'

export type ClusterSearchMode = 'auto' | 'stay' | 'better'

export type FarmSearchArea = {
  centerSystem: string
  radiusLy: number
}

export type FarmSearchOrigin =
  ({ kind: 'coords'; name: string } & Coords3D) | { kind: 'name'; name: string }

export type FarmSearchParams = {
  mode: FarmMode
  currentSystem: FarmSearchOrigin
  jumpRangeLy: number
  jumpMultiplier?: number
  padSize?: PadSize
  area?: FarmSearchArea
  systemLimit?: number
  excludeSurface?: boolean
  excludeSecondaryStar?: boolean
}

export type ScoreReason = {
  label: string
  delta: number
}

export type ScoredStation = {
  station: CachedStation
  factions: StationFactionSummary
  factionsDataState: 'unknown'
  rating: StationRatingValue | undefined
  missionCount: number
  score: number
  reasons: ScoreReason[]
}

export type ScoredSystemGroup = {
  systemId: string
  systemName: string
  distanceLy: number
  stations: ScoredStation[]
  hiddenNoBoard?: number
  updatedAt?: string
  updatedBy?: DataSource
  bestScore: number
  missionCount: number
}

export type RawSystemGroup = {
  systemId: string
  systemName: string
  distanceLy: number
  stations: CachedStation[]
  hiddenNoBoard?: number
  systemFactionSummary: StationFactionSummary
  updatedAt?: string
  updatedBy?: DataSource
}

export type FarmSearchStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty'
