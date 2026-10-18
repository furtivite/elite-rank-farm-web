import { RANK_COUNT, type CommanderState, type NavyProgress } from '@/entities/commander-state'
import type { FarmMode } from '@/features/farm-recommender/model/types'

export type CompletedSides = Record<FarmMode, boolean>

export const NO_COMPLETED_SIDES: CompletedSides = { empire: false, federal: false }

const TOP_RANK = RANK_COUNT - 1
const FULL_PROGRESS = 100

export function completedSides(
  state: CommanderState | null,
  progress: NavyProgress | null,
): CompletedSides {
  if (state === null || progress === null) {
    return NO_COMPLETED_SIDES
  }

  return {
    empire: state.imperialRank >= TOP_RANK || progress.imperial.percent >= FULL_PROGRESS,
    federal: state.federalRank >= TOP_RANK || progress.federal.percent >= FULL_PROGRESS,
  }
}

export function effectiveFarmMode(chosen: FarmMode, completed: CompletedSides): FarmMode {
  const other: FarmMode = chosen === 'empire' ? 'federal' : 'empire'

  return completed[chosen] && !completed[other] ? other : chosen
}
