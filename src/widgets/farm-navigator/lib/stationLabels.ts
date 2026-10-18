import type { DataSource } from '@/entities/galaxy-data'
import type { FarmMode } from '@/features/farm-recommender'
import type { StationRatingValue } from '@/entities/station-rating'
import { formatDateTime } from '@/shared/lib/formatDateTime'
import type { Language, Translate, TranslationKey } from '@/shared/lib/i18n'

export const PAD_LABEL: Record<'S' | 'M' | 'L', string> = { S: 'S pad', M: 'M pad', L: 'L pad' }

export const ACCENTED_ALLEGIANCE: Record<FarmMode, 'imperial' | 'federal'> = {
  empire: 'imperial',
  federal: 'federal',
}

export const ALLEGIANCE_OF: Record<FarmMode, string> = {
  empire: 'Empire',
  federal: 'Federation',
}

export const ALLEGIANCE_LABEL_KEYS: Record<string, TranslationKey> = {
  Empire: 'allegiance.Empire',
  Federation: 'allegiance.Federation',
  Alliance: 'allegiance.Alliance',
  Independent: 'allegiance.Independent',
  Other: 'allegiance.Other',
}

export function ratingNote(rating: StationRatingValue | undefined, t: Translate): string {
  if (rating === 'good') {
    return ` · ${t('station.ratedGood')}`
  }
  if (rating === 'bad') {
    return ` · ${t('station.ratedBad')}`
  }

  return ''
}

export function missionBoardLabel(
  hasMissionBoard: boolean | undefined,
  source: DataSource | undefined,
  t: Translate,
): string {
  if (hasMissionBoard === undefined) {
    return t('station.missionBoardUnknown')
  }

  if (hasMissionBoard) {
    return t('station.missionBoard')
  }

  return source === 'journal' ? t('station.noMissionBoard') : t('station.missionBoardDoubtful')
}

export function formatFineDate(iso: string, language: Language): string {
  const parsed = Date.parse(iso)
  return Number.isNaN(parsed) ? iso : formatDateTime(parsed, language)
}
