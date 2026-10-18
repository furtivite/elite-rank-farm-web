export { useCommanderState } from '@/entities/commander-state/model/useCommanderState'
export type {
  NavyProgress,
  NavyProgressValue,
  UseCommanderStateResult,
} from '@/entities/commander-state/model/useCommanderState'
export {
  displayedProgress,
  isProgressStale,
  trackProgress,
} from '@/entities/commander-state/model/rankProgress'
export type {
  ProgressTracker,
  RankProgressPair,
} from '@/entities/commander-state/model/rankProgress'
export { fetchCommanderState } from '@/entities/commander-state/api/fetchCommanderState'
export { PRESENCE_STALE_AFTER_MS } from '@/entities/commander-state/model/commanderStore'
export { isDockedNow } from '@/entities/commander-state/model/commanderStore'
export { parseCommanderStateResponse } from '@/entities/commander-state/model/validate'
export {
  federalRankName,
  imperialRankName,
  RANK_COUNT,
} from '@/entities/commander-state/model/ranks'
export type {
  CommanderPresence,
  CommanderState,
  CommanderStateResponse,
  CommanderStateStatus,
} from '@/entities/commander-state/model/types'
export { COMMANDER_POLL_INTERVAL_MS } from '@/entities/commander-state/model/useCommanderState'
export {
  getMockSnapshot,
  getServerMockSnapshot,
  setMockScenario,
  subscribeToMock,
} from '@/entities/commander-state/model/mockStore'
export { findScenario, MOCK_SCENARIOS } from '@/entities/commander-state/model/mockScenarios'
export type { MockScenario, MockScenarioId } from '@/entities/commander-state/model/mockScenarios'
export { hasFeature } from '@/entities/commander-state/lib/features'
export {
  fineForFaction,
  FINE_COVERAGE_NOTE_KEY,
  type FineNotice,
} from '@/entities/commander-state/lib/fines'
export { estimateJumpRange } from '@/entities/commander-state/lib/jumpRange'
export type { JumpRangeEstimate, LoadoutFacts } from '@/entities/commander-state/lib/jumpRange'
export {
  getPositionHistorySnapshot,
  getServerPositionHistorySnapshot,
  isShuttling,
  mergeHistories,
  notePosition,
  POSITION_HISTORY_LIMIT,
  recordVisit,
  subscribeToPositionHistory,
  type PositionVisit,
} from '@/entities/commander-state/model/positionHistory'
export { usePositionHistory } from '@/entities/commander-state/model/usePositionHistory'
