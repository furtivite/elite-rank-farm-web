import type { Translate } from '@/shared/lib/i18n'
import { MISSION_LIMIT } from '@/entities/mission-store/model/types'

export type SlotCount = {
  used: number
  aside: number | null
  limit: number
  canAddManual: boolean
}

export function slotCount(
  journalMissions: number,
  manualMissions: number,
  excludeManualFromCount: boolean,
): SlotCount {
  if (!excludeManualFromCount) {
    const used = journalMissions + manualMissions

    return { used, aside: null, limit: MISSION_LIMIT, canAddManual: used < MISSION_LIMIT }
  }

  return {
    used: journalMissions,
    aside: manualMissions === 0 ? null : manualMissions,
    limit: MISSION_LIMIT,
    canAddManual: true,
  }
}

export function formatSlotCount(count: SlotCount): string {
  const used = count.aside === null ? `${count.used}` : `${count.used} (${count.aside})`

  return `${used} / ${count.limit}`
}

export function describeSlotCount(count: SlotCount, t: Translate): string {
  const base = t('slots.used', { used: count.used, limit: count.limit })

  return count.aside === null ? base : t('slots.aside', { base, aside: count.aside })
}
