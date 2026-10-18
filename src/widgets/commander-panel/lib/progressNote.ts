import type { NavyProgressValue } from '@/entities/commander-state'
import { RANK_COUNT } from '@/entities/commander-state'
import type { Language, Translate } from '@/shared/lib/i18n'
import { formatDateTime } from '@/shared/lib/formatDateTime'

function formatTimestamp(iso: string, language: Language): string {
  const parsed = Date.parse(iso)
  return Number.isNaN(parsed) ? iso : formatDateTime(parsed, language)
}

export function progressNote(
  { percent, at }: NavyProgressValue,
  rankIndex: number,
  rankMissionTaken: boolean,
  t: Translate,
): string {
  if (rankIndex >= RANK_COUNT - 1) {
    return t('progress.rankMax')
  }

  if (percent >= 100) {
    return rankMissionTaken ? t('progress.rankFullMissionTaken') : t('progress.rankFull')
  }

  if (percent === 0) {
    return at === null
      ? t('progress.resetNoTime')
      : t('progress.resetAt', { when: formatTimestamp(at, t.language) })
  }

  const refresh = t('progress.refresh')

  return at === null
    ? t('progress.percentNoTime', { percent, refresh })
    : t('progress.percentAt', {
        percent,
        when: formatTimestamp(at, t.language),
        refresh,
      })
}
