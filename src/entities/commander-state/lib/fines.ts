import type { UseCommanderStateResult } from '@/entities/commander-state/model/useCommanderState'

export type FineNotice = { observedAt: string }

export const FINE_COVERAGE_NOTE_KEY = 'fines.notice' as const

export function fineForFaction(
  commander: UseCommanderStateResult,
  factionName: string | undefined,
): FineNotice | null {
  if (factionName === undefined || factionName === '') {
    return null
  }

  const found = commander.data?.finedFactions.find(
    (entry) => entry.name.trim().toLowerCase() === factionName.trim().toLowerCase(),
  )

  return found === undefined ? null : { observedAt: found.observedAt }
}
