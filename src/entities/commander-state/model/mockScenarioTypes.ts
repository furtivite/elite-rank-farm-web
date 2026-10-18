import type { TranslationKey } from '@/shared/lib/i18n'
import type { JournalMission, StoredMission } from '@/entities/mission-store'
import type {
  CommanderStateResponse,
  CommanderStateStatus,
} from '@/entities/commander-state/model/types'

export type MockScenarioId =
  | 'off'
  | 'guest'
  | 'no-state'
  | 'docked'
  | 'in-space'
  | 'empty-search'
  | 'after-promotion'
  | 'promoted-twice'
  | 'rank-max'
  | 'federal'
  | 'empire-completed'
  | 'agent-outdated'
  | 'journal-basket'
  | 'journal-partial'
  | 'journal-cargo'
  | 'journal-cargo-untouched'
  | 'journal-collect-awaiting'
  | 'journal-wing-ring'
  | 'manual-basket'
  | 'mixed-basket'
  | 'duplicate-basket'
  | 'game-running'
  | 'agent-silent'
  | 'fined-faction'
  | 'big-ship'
  | 'error'

export type MockScenario = {
  id: MockScenarioId
  labelKey: TranslationKey
  descriptionKey: TranslationKey
  status: CommanderStateStatus
  data: CommanderStateResponse | null
  journalMissions?: JournalMission[]
  manualMissions?: StoredMission[]
  progress: {
    imperial: { percent: number; at: string | null }
    federal: { percent: number; at: string | null }
  } | null
  errorMessage: string | null
}
