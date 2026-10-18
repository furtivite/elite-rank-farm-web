import type { TranslationKey } from '@/shared/lib/i18n'

export type AccumulationStatus = 'accumulate' | 'reasonable' | 'high'

export type AccumulationThresholds = {
  reasonable: number
  high: number
}

export const ACCUMULATION_DEFAULTS: AccumulationThresholds = { reasonable: 3, high: 5 }

export const ACCUMULATION_MIN = 1
export const ACCUMULATION_MAX = 20

export function accumulationStatus(
  activeMissions: number,
  thresholds: AccumulationThresholds = ACCUMULATION_DEFAULTS,
): AccumulationStatus {
  const { reasonable, high } = normalizeThresholds(thresholds)

  if (activeMissions >= high) {
    return 'high'
  }

  return activeMissions >= reasonable ? 'reasonable' : 'accumulate'
}

export function normalizeThresholds(thresholds: AccumulationThresholds): AccumulationThresholds {
  const reasonable = clamp(thresholds.reasonable)
  return { reasonable, high: Math.max(reasonable, clamp(thresholds.high)) }
}

function clamp(value: number): number {
  if (Number.isNaN(value)) {
    return ACCUMULATION_MIN
  }

  return Math.min(ACCUMULATION_MAX, Math.max(ACCUMULATION_MIN, Math.round(value)))
}

export const ACCUMULATION_LABEL_KEYS: Record<AccumulationStatus, TranslationKey> = {
  accumulate: 'accumulation.accumulate',
  reasonable: 'accumulation.reasonable',
  high: 'accumulation.high',
}
