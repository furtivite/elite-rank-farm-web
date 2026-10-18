export type GalaxyRegionId = 'imperial-ngalinn' | 'federal-canopus' | 'galaxy'
export type RegionCliKey = 'imperial' | 'federal' | 'galaxy'

export type StationFaction = {
  name: string
  allegiance: 'Empire' | 'Federation' | 'Alliance' | 'Independent' | 'Other'
}

export type StationFactionSummary = {
  imperial: number
  federal: number
  alliance: number
  independent: number
  other: number
}

export type StationFactionData =
  | {
      status: 'known'
      factionIds: string[]
      source: 'journal' | 'external'
      observedAt: string
    }
  | {
      status: 'unknown'
    }

export type ArrivalStar = {
  name?: string
  isMain: boolean
  source: 'dump' | 'manual'
}

export type DataSource = 'journal' | 'external' | 'builder'

export type CachedStation = {
  id: string
  systemId: string
  name: string
  bodyName?: string
  star?: ArrivalStar
  type?: string
  distanceToArrivalLs?: number
  maxPadSize?: 'S' | 'M' | 'L'
  hasMissionBoard?: boolean
  missionBoardSource?: DataSource
  controllingFaction?: StationFaction
  missionProviderFactions: StationFactionData
  updatedAt: string
  updatedBy?: DataSource
}

export type CachedSystem = {
  id: string
  name: string
  x: number
  y: number
  z: number
  regionIds: GalaxyRegionId[]
  updatedAt: string
  systemFactions: StationFaction[]
  systemFactionSummary: StationFactionSummary
  stations: CachedStation[]
  updatedBy?: DataSource
}

export type SystemIndexEntry = {
  id: string
  name: string
  x: number
  y: number
  z: number
  chunk: string
  stations?: number
  missionBoards?: number
  largePad?: boolean
}

export type RegionMeta = {
  schemaVersion: 1
  generatedAt: string
  regionId: GalaxyRegionId
  centerSystem: string
  radiusLy: number
  systems: number
  stations: number
  chunkCount: number
  possiblyTruncated: boolean
  indexCellLy?: number
  nameBucketCount?: number
  clusterRadiusLy?: number
  clusterNearStarLs?: number
}

export type Manifest = {
  schemaVersion: 1
  generatedAt: string
  regions: Partial<
    Record<
      RegionCliKey,
      {
        centerSystem: string
        radiusLy: number
        systemsIndex: string
        revision?: number
      }
    >
  >
}

export type ClusterMetrics = {
  systems: number
  stations: number
  stationsNearStar: number
  medianArrivalLs: number | null
}

export type ClusterCandidateEntry = {
  systemName: string
  x: number
  y: number
  z: number
  byFilter: Record<string, ClusterMetrics>
}

export type RegionClusters = {
  schemaVersion: 1
  generatedAt: string
  regionId: GalaxyRegionId
  radiusLy: number
  nearStarLs: number
  candidates: ClusterCandidateEntry[]
}

export type GalaxyRegionStatus = {
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage: string | null
  meta: RegionMeta | null
}
