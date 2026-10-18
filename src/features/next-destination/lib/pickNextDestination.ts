import type { Translate } from '@/shared/lib/i18n'
import type { JumpEstimate } from '@/entities/galaxy-data'
import type {
  MissionStationFacts,
  MissionSystemGroup,
  StationFactsByStationId,
} from '@/entities/mission-store'
import type { StationRatingValue, StationRatingsMap } from '@/entities/station-rating'
import {
  bestStation,
  factsOf,
  isSameSystem,
  mostMissionsAnywhere,
  sameName,
} from '@/features/next-destination/lib/bestStation'

export type PinnedTarget = {
  systemKey: string
  stationKey: string | null
}

export type NextDestinationReason = {
  label: string
  caution?: boolean
}

export type NextDestination = {
  systemKey: string
  systemName: string
  stationKey: string
  stationName: string
  stationId?: string
  bodyName: string | null
  missionsInSystem: number
  missionsAtStation: number
  completedAtStation: number
  jumps: JumpEstimate | null
  facts: MissionStationFacts | undefined
  rating: StationRatingValue | undefined
  isPinned: boolean
  reasons: NextDestinationReason[]
}

export type NextDestinationContext = {
  freeingSlots?: boolean
  stationFacts?: StationFactsByStationId
  ratings?: StationRatingsMap
  pinned?: PinnedTarget | null
  currentSystemName?: string | null
  currentStationName?: string | null
}

function jumpsReason(jumps: JumpEstimate | null, t: Translate): NextDestinationReason {
  if (jumps === null) {
    return { label: t('next.unknownDistance') }
  }
  if (jumps.minJumps === 0) {
    return { label: t('next.alreadyInSystem') }
  }

  return {
    label: t('next.jumpsAndDistance', {
      jumps: t.plural('plural.jumpsAtLeast', jumps.minJumps),
      distance: jumps.distanceLy.toFixed(1),
    }),
    caution: jumps.isFar,
  }
}

export function pickNextDestination(
  groups: readonly MissionSystemGroup[],
  t: Translate,
  context: NextDestinationContext = {},
): NextDestination | null {
  const {
    stationFacts,
    ratings,
    pinned,
    currentSystemName,
    currentStationName,
    freeingSlots = false,
  } = context

  const pinnedSystem =
    pinned === null || pinned === undefined
      ? null
      : (groups.find((group) => group.key === pinned.systemKey) ?? null)

  const system = pinnedSystem ?? groups[0]
  if (system === undefined) {
    return null
  }

  const pinnedStation =
    pinnedSystem === null || pinned?.stationKey == null
      ? null
      : (pinnedSystem.bodies
          .flatMap((body) => body.stations.map((station) => ({ station, bodyName: body.bodyName })))
          .find((entry) => entry.station.key === pinned.stationKey) ?? null)

  const choice =
    pinnedStation ??
    (freeingSlots && pinnedSystem === null ? mostMissionsAnywhere(groups, stationFacts) : null) ??
    bestStation(system, stationFacts)
  if (choice === null) {
    return null
  }

  const { station, bodyName } = choice
  const targetSystem =
    groups.find((group) => group.bodies.some((body) => body.stations.includes(station))) ?? system
  const facts = factsOf(station, stationFacts)
  const rating = station.stationId === undefined ? undefined : ratings?.[station.stationId]?.rating
  const completed = station.completedCount
  const isPinned = pinnedSystem !== null

  const reasons: NextDestinationReason[] = []

  if (isPinned) {
    reasons.push({ label: t('next.pinned') })
  }

  if (freeingSlots) {
    reasons.push({
      label: t('next.frees', { slots: t.plural('plural.slots', station.missions.length) }),
    })
  }

  reasons.push({
    label: t('score.missionsInSystem', {
      count: t.plural('plural.missions', targetSystem.missionCount),
    }),
  })
  if (station.missions.length !== targetSystem.missionCount) {
    reasons.push({
      label: t('score.missionsHere', {
        count: t.plural('plural.missions', station.missions.length),
      }),
    })
  }

  if (completed > 0) {
    reasons.push({
      label:
        completed === 1 ? t('next.completedOne') : t('next.completedMany', { count: completed }),
    })
  }

  const inThisSystem = isSameSystem(targetSystem, currentSystemName)

  if (
    inThisSystem &&
    currentStationName != null &&
    sameName(station.stationName, currentStationName)
  ) {
    reasons.push({ label: t('next.alreadyDocked') })
  } else if (inThisSystem) {
    reasons.push({ label: t('next.alreadyInSystem') })
  } else {
    reasons.push(jumpsReason(targetSystem.jumps, t))
  }

  reasons.push(
    facts?.distanceToArrivalLs === undefined
      ? { label: t('next.supercruiseUnknown') }
      : { label: t('next.distanceToStation', { ls: Math.round(facts.distanceToArrivalLs) }) },
  )

  if (facts?.maxPadSize !== undefined) {
    reasons.push({ label: t('next.pad', { size: facts.maxPadSize }) })
  }

  if (rating === 'good') {
    reasons.push({ label: t('next.ratedGood') })
  } else if (rating === 'bad') {
    reasons.push({ label: t('next.ratedBad'), caution: true })
  } else if (rating === 'blocked') {
    reasons.push({ label: t('next.blockedButAccepted'), caution: true })
  }

  return {
    systemKey: targetSystem.key,
    systemName: targetSystem.systemName,
    stationKey: station.key,
    stationName: station.stationName,
    stationId: station.stationId,
    bodyName,
    missionsInSystem: targetSystem.missionCount,
    missionsAtStation: station.missions.length,
    completedAtStation: completed,
    jumps: targetSystem.jumps,
    facts,
    rating,
    isPinned,
    reasons,
  }
}
