import type { Translate, TranslationKey } from '@/shared/lib/i18n'

export const RANK_COUNT = 15

export function rankName(side: 'imperial' | 'federal', index: number, t: Translate): string {
  if (!Number.isInteger(index) || index < 0 || index >= RANK_COUNT) {
    return t('rank.unknown', { index })
  }

  return t(`rank.${side}.${index}` as TranslationKey)
}

export function imperialRankName(index: number, t: Translate): string {
  return rankName('imperial', index, t)
}

export function federalRankName(index: number, t: Translate): string {
  return rankName('federal', index, t)
}
