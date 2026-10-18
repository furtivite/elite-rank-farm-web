import type { UseCommanderStateResult } from '@/entities/commander-state/model/useCommanderState'

export function hasFeature(commander: UseCommanderStateResult, name: string): boolean {
  return commander.data?.features.includes(name) === true
}
