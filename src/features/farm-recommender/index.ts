export { useFarmSearch } from '@/features/farm-recommender/model/useFarmSearch'
export { useJumpOrigin } from '@/features/farm-recommender/model/useJumpOrigin'
export type { UseFarmSearchResult } from '@/features/farm-recommender/model/useFarmSearch'
export { buildScoredGroups } from '@/features/farm-recommender/lib/buildScoredGroups'
export { groupStationsByBody } from '@/features/farm-recommender/lib/groupStationsByBody'
export {
  DEFAULT_RESULTS_SORT,
  EMPTY_RESULTS_FILTER,
  filterScoredGroups,
  sortScoredGroups,
} from '@/features/farm-recommender/lib/filterScoredGroups'
export type { ResultsFilter, ResultsSort } from '@/features/farm-recommender/lib/filterScoredGroups'
export { scoreStation } from '@/features/farm-recommender/lib/scoreStation'
export { CLUSTER_TOP_STATIONS, rankClusters } from '@/features/farm-recommender/lib/rankClusters'
export { discoverClusters } from '@/features/farm-recommender/lib/discoverClusters'
export type { ClusterCandidate } from '@/features/farm-recommender/lib/discoverClusters'
export {
  DISCOVERY_RADIUS_LY,
  useClusterDiscovery,
} from '@/features/farm-recommender/model/useClusterDiscovery'
export type { UseClusterDiscoveryResult } from '@/features/farm-recommender/model/useClusterDiscovery'
export type {
  ClusterSearchResult,
  ClusterSummary,
} from '@/features/farm-recommender/lib/rankClusters'
export {
  AUTO_DISCOVERY_LABEL,
  useClusterComparison,
} from '@/features/farm-recommender/model/useClusterComparison'
export type { UseClusterComparisonResult } from '@/features/farm-recommender/model/useClusterComparison'
export {
  canLand,
  isPadCompatible,
  isPadOptionAvailable,
  PAD_SIZE_OPTIONS,
} from '@/features/farm-recommender/lib/padCompatibility'
export type { PadSizeOption } from '@/features/farm-recommender/lib/padCompatibility'
export {
  passesSurfaceFilter,
  stationPlacement,
} from '@/features/farm-recommender/lib/stationPlacement'
export { FARM_MODE_TO_REGION } from '@/features/farm-recommender/model/types'
export {
  completedSides,
  effectiveFarmMode,
  NO_COMPLETED_SIDES,
  type CompletedSides,
} from '@/features/farm-recommender/lib/rankCompletion'
export type { BodyGroup } from '@/features/farm-recommender/lib/groupStationsByBody'
export type { StationPlacement } from '@/features/farm-recommender/lib/stationPlacement'
export type {
  ClusterSearchMode,
  FarmMode,
  FarmRegionKey,
  FarmSearchArea,
  FarmSearchOrigin,
  FarmSearchParams,
  FarmSearchStatus,
  PadSize,
  RawSystemGroup,
  ScoreReason,
  ScoredStation,
  ScoredSystemGroup,
} from '@/features/farm-recommender/model/types'
