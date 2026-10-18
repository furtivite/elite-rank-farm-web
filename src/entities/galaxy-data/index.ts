export {
  getClustersNear,
  getRegionClusters,
  getRegionMeta,
  getRegionSystemsForLegacyLookup,
  getSystem,
  getStations,
  getSystemCoordsByIds,
  getSystemsByIds,
  getSystemsInRadius,
  getSystemsWithStationsInRadius,
  loadSystemsForEntries,
  refreshSystem,
  resolveSystemCoords,
  searchSystemsByName,
} from '@/entities/galaxy-data/api/galaxyDataProvider'
export { useSystemRefresh } from '@/entities/galaxy-data/model/useSystemRefresh'
export type {
  SystemRefreshState,
  UseSystemRefreshResult,
} from '@/entities/galaxy-data/model/useSystemRefresh'
export type { FetchSystemSnapshotResult } from '@/entities/galaxy-data/api/fetchSystemSnapshot'
export { useGalaxyRegionStatus } from '@/entities/galaxy-data/model/useGalaxyRegionStatus'
export { distanceLy, findSystemsWithinRadius } from '@/entities/galaxy-data/lib/spatialSearch'
export {
  estimateJumps,
  jumpPenalty,
  MULTI_JUMP_FROM,
} from '@/entities/galaxy-data/lib/jumpEstimate'
export type { JumpEstimate } from '@/entities/galaxy-data/lib/jumpEstimate'
export { jumpsFromOrigin } from '@/entities/galaxy-data/lib/jumpGraph'
export { withGraphJumps } from '@/entities/galaxy-data/lib/jumpEstimate'
export type { StarLayer, StarLayerEntry } from '@/entities/galaxy-data/lib/jumpGraph'
export {
  getStarLayerNear,
  _resetStarLayerCacheForTests,
} from '@/entities/galaxy-data/api/fetchStarLayer'
export {
  arrivalStarNote,
  formatArrivalDistance,
  isDistantArrival,
  DISTANT_ARRIVAL_LS,
} from '@/entities/galaxy-data/lib/arrivalStar'
export type {
  ArrivalStar,
  CachedStation,
  CachedSystem,
  DataSource,
  ClusterCandidateEntry,
  ClusterMetrics,
  RegionClusters,
  GalaxyRegionId,
  RegionCliKey,
  RegionMeta,
  StationFaction,
  StationFactionData,
  StationFactionSummary,
  SystemIndexEntry,
} from '@/entities/galaxy-data/model/types'
export type { Coords3D, ReachableSystem } from '@/entities/galaxy-data/lib/spatialSearch'
export type { UseGalaxyRegionStatusResult } from '@/entities/galaxy-data/model/useGalaxyRegionStatus'
export {
  getServerStarMarkSnapshot,
  getStarMarkSnapshot,
  subscribeToStarMarks,
  toggleStarMark,
  _resetStarMarksForTests,
} from '@/entities/galaxy-data/model/starMarkStore'
export { setStationStarMark } from '@/entities/galaxy-data/api/setStationStarMark'
export { fetchStarMarks, type StarMark } from '@/entities/galaxy-data/api/fetchStarMarks'
