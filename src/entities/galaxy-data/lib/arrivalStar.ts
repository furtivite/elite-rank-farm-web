import type { ArrivalStar } from '@/entities/galaxy-data/model/types'
import { LOCALE, type Language, type Translate } from '@/shared/lib/i18n'

export function arrivalStarNote(star: ArrivalStar | undefined, t: Translate): string | null {
  if (star === undefined || star.isMain) {
    return null
  }

  return star.name === undefined ? t('star.other') : t('star.otherNamed', { name: star.name })
}

export const DISTANT_ARRIVAL_LS = 20_000

const numberFormatters = new Map<Language, Intl.NumberFormat>()

function numberFormatter(language: Language): Intl.NumberFormat {
  let cached = numberFormatters.get(language)
  if (cached === undefined) {
    cached = new Intl.NumberFormat(LOCALE[language])
    numberFormatters.set(language, cached)
  }

  return cached
}

export function formatArrivalDistance(distanceLs: number, t: Translate): string {
  return `${numberFormatter(t.language).format(Math.round(distanceLs))}\u00a0${t('unit.ls')}`
}

export function isDistantArrival(distanceLs: number | undefined): boolean {
  return distanceLs !== undefined && distanceLs >= DISTANT_ARRIVAL_LS
}
