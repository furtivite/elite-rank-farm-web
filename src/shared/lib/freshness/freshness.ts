import type { Translate } from '@/shared/lib/i18n'

export type DataFreshness = 'fresh' | 'stale' | 'unknown'

export const STALE_AFTER_DAYS = 90

const DAY_MS = 24 * 60 * 60 * 1000

export function freshness(
  updatedAt: string | undefined,
  now: number,
  staleAfterDays: number = STALE_AFTER_DAYS,
): DataFreshness {
  const ageMs = ageInMs(updatedAt, now)
  if (ageMs === null) {
    return 'unknown'
  }

  return ageMs > staleAfterDays * DAY_MS ? 'stale' : 'fresh'
}

export function ageInMs(updatedAt: string | undefined, now: number): number | null {
  if (updatedAt === undefined || updatedAt === '') {
    return null
  }

  const parsed = new Date(updatedAt).getTime()
  if (Number.isNaN(parsed)) {
    return null
  }

  return Math.max(0, now - parsed)
}

export function startOfDay(now: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function formatAge(updatedAt: string | undefined, now: number, t: Translate): string | null {
  const ageMs = ageInMs(updatedAt, now)
  if (ageMs === null) {
    return null
  }

  const days = Math.floor(ageMs / DAY_MS)
  if (days === 0) {
    return t('age.today')
  }

  if (days < 31) {
    return t('age.ago', { age: t.plural('plural.days', days) })
  }

  const years = Math.floor(days / 365)
  if (years === 0) {
    const months = Math.floor(days / 30)
    return t('age.ago', { age: t.plural('plural.months', months) })
  }

  return t('age.ago', { age: t.plural('plural.years', years) })
}
