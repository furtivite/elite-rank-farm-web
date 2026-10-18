import type { CachedStation, StationFaction } from '@/entities/galaxy-data'
import { freshness } from '@/shared/lib/freshness'
import type { StationRatingValue } from '@/entities/station-rating'
import type { FarmMode, ScoreReason } from '@/features/farm-recommender/model/types'
import type { Translate, TranslationKey } from '@/shared/lib/i18n'

const GOOD_RATING_BONUS = 15
const BAD_RATING_PENALTY = -15

const OWN_ALLEGIANCE_BONUS = 10

const OWN_ALLEGIANCE: Record<FarmMode, StationFaction['allegiance']> = {
  empire: 'Empire',
  federal: 'Federation',
}

const STALE_DATA_PENALTY = -3

const SYSTEM_MISSION_BONUS = 5
const SYSTEM_MISSION_CAP = 25
const STATION_MISSION_BONUS = 2
const STATION_MISSION_CAP = 10

export type ScoreStationInput = {
  t: Translate
  station: CachedStation
  rating: StationRatingValue | undefined
  missionCount: number
  systemMissionCount: number
  systemUpdatedAt?: string
  now?: number
  farmMode?: FarmMode
}

const DTA_STEPS: readonly { upTo: number; delta: number; key: TranslationKey }[] = [
  { upTo: 100, delta: 16, key: 'score.dtaNearStar' },
  { upTo: 500, delta: 12, key: 'score.dtaClose' },
  { upTo: 1500, delta: 8, key: 'score.dtaMedium' },
  { upTo: 5000, delta: 4, key: 'score.dtaFar' },
  { upTo: 20000, delta: 1, key: 'score.dtaVeryFar' },
]

function scoreDistanceToArrival(
  distanceToArrivalLs: number | undefined,
  t: Translate,
): ScoreReason {
  if (distanceToArrivalLs === undefined) {
    return { label: t('score.dtaUnknown'), delta: 0 }
  }

  const ls = Math.round(distanceToArrivalLs)
  const step = DTA_STEPS.find((entry) => distanceToArrivalLs <= entry.upTo)

  return step === undefined
    ? { label: t('score.dtaVeryFar', { ls }), delta: 0 }
    : { label: t(step.key, { ls }), delta: step.delta }
}

const LARGE_PORT_TYPES = ['coriolis', 'orbis', 'dodec', 'ocellus']
const LARGE_PORT_BONUS = 5

function scoreStationSize(type: string | undefined, t: Translate): ScoreReason | null {
  const normalized = type?.trim().toLowerCase() ?? ''
  if (!LARGE_PORT_TYPES.some((marker) => normalized.includes(marker))) {
    return null
  }

  return { label: t('score.largePort'), delta: LARGE_PORT_BONUS }
}

function scoreRating(rating: StationRatingValue | undefined): ScoreReason | null {
  if (rating === 'good') {
    return { label: 'Good farm', delta: GOOD_RATING_BONUS }
  }
  if (rating === 'bad') {
    return { label: 'Bad farm', delta: BAD_RATING_PENALTY }
  }
  return null
}

function scoreSystemMissions(count: number, t: Translate): ScoreReason | null {
  if (count <= 0) {
    return null
  }

  return {
    label: t('score.missionsInSystem', { count: t.plural('plural.missions', count) }),
    delta: Math.min(count * SYSTEM_MISSION_BONUS, SYSTEM_MISSION_CAP),
  }
}

function scoreStationMissions(count: number, t: Translate): ScoreReason | null {
  if (count <= 0) {
    return null
  }

  return {
    label: t('score.missionsHere', { count }),
    delta: Math.min(count * STATION_MISSION_BONUS, STATION_MISSION_CAP),
  }
}

function scoreAllegiance(
  t: Translate,
  controllingFaction: StationFaction | undefined,
  farmMode: FarmMode | undefined,
): ScoreReason | null {
  if (farmMode === undefined || controllingFaction === undefined) {
    return null
  }

  if (controllingFaction.allegiance !== OWN_ALLEGIANCE[farmMode]) {
    return null
  }

  return {
    label: farmMode === 'empire' ? t('score.empireStation') : t('score.federationStation'),
    delta: OWN_ALLEGIANCE_BONUS,
  }
}

function scoreFreshness(
  systemUpdatedAt: string | undefined,
  now: number | undefined,
  t: Translate,
) {
  if (now === undefined) {
    return null
  }

  return freshness(systemUpdatedAt, now) === 'stale'
    ? { label: t('score.staleData'), delta: STALE_DATA_PENALTY }
    : null
}

export function scoreStation(input: ScoreStationInput): { score: number; reasons: ScoreReason[] } {
  const reasons: ScoreReason[] = []

  reasons.push(scoreDistanceToArrival(input.station.distanceToArrivalLs, input.t))

  const ratingReason = scoreRating(input.rating)
  if (ratingReason) {
    reasons.push(ratingReason)
  }

  const systemMissions = scoreSystemMissions(input.systemMissionCount, input.t)
  if (systemMissions) {
    reasons.push(systemMissions)
  }

  const stationMissions = scoreStationMissions(input.missionCount, input.t)
  if (stationMissions) {
    reasons.push(stationMissions)
  }

  const size = scoreStationSize(input.station.type, input.t)
  if (size) {
    reasons.push(size)
  }

  const allegiance = scoreAllegiance(input.t, input.station.controllingFaction, input.farmMode)
  if (allegiance) {
    reasons.push(allegiance)
  }

  const staleness = scoreFreshness(input.systemUpdatedAt, input.now, input.t)
  if (staleness) {
    reasons.push(staleness)
  }

  const score = reasons.reduce((sum, reason) => sum + reason.delta, 0)

  return { score, reasons }
}
