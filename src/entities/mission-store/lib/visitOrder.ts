import type {
  MissionStationGroup,
  MissionSystemGroup,
} from '@/entities/mission-store/lib/groupMissions'
import type { StationFactsByStationId } from '@/entities/mission-store/model/useMissionStationFacts'
import { compareBySupercruise } from '@/shared/lib/supercruiseOrder'
import type { Translate } from '@/shared/lib/i18n'

export type VisitStop = {
  stationName: string
  missions: number
  distanceLs: number | undefined
}

export function visitOrder(
  system: MissionSystemGroup,
  facts: StationFactsByStationId,
): VisitStop[] {
  const stops: VisitStop[] = []

  for (const body of system.bodies) {
    for (const station of body.stations) {
      const missions = activeMissions(station)
      if (missions === 0) {
        continue
      }

      stops.push({
        stationName: station.stationName,
        missions,
        distanceLs:
          station.stationId === undefined
            ? undefined
            : facts.get(station.stationId)?.distanceToArrivalLs,
      })
    }
  }

  return stops.sort(
    (left, right) =>
      compareBySupercruise(left.distanceLs, right.distanceLs) ||
      right.missions - left.missions ||
      left.stationName.localeCompare(right.stationName),
  )
}

function activeMissions(station: MissionStationGroup): number {
  return station.missions.length - station.completedCount - station.awaitingCount
}

export function formatVisitOrder(stops: readonly VisitStop[], t: Translate): string | null {
  if (stops.length < 2) {
    return null
  }

  const [first, ...rest] = stops
  const tail = rest
    .map((stop, index) =>
      t(index === 0 ? 'visit.then' : 'visit.after', {
        station: stop.stationName,
        missions: stop.missions,
      }),
    )
    .join(', ')

  return t('visit.first', {
    station: first.stationName,
    missions: t.plural('plural.missions', first.missions),
    tail,
  })
}
