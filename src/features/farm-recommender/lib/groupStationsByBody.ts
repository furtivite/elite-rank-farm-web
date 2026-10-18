import { stationPlacement } from '@/features/farm-recommender/lib/stationPlacement'
import type { ScoredStation } from '@/features/farm-recommender/model/types'
import { compareBySupercruise } from '@/shared/lib/supercruiseOrder'

export type BodyGroup = {
  bodyName: string | null
  stations: ScoredStation[]
  bestScore: number
  nearestLs: number | undefined
  missionCount: number
}

const NO_BODY_KEY = ' orbit'

export function groupStationsByBody(stations: ScoredStation[]): BodyGroup[] {
  const groups = new Map<string, BodyGroup>()

  for (const scored of stations) {
    const trimmed = scored.station.bodyName?.trim()
    const bodyName = trimmed === undefined || trimmed === '' ? null : trimmed
    const key = bodyName === null ? NO_BODY_KEY : bodyName

    const existing = groups.get(key)
    if (existing) {
      existing.stations.push(scored)
      existing.bestScore = Math.max(existing.bestScore, scored.score)
      existing.missionCount += scored.missionCount
      if (compareBySupercruise(scored.station.distanceToArrivalLs, existing.nearestLs) < 0) {
        existing.nearestLs = scored.station.distanceToArrivalLs
      }
      continue
    }

    groups.set(key, {
      bodyName,
      stations: [scored],
      bestScore: scored.score,
      nearestLs: scored.station.distanceToArrivalLs,
      missionCount: scored.missionCount,
    })
  }

  for (const group of groups.values()) {
    group.stations.sort(compareWithinBody)
  }

  return [...groups.values()].sort(
    (a, b) => compareBySupercruise(a.nearestLs, b.nearestLs) || b.bestScore - a.bestScore,
  )
}

const PLACEMENT_ORDER: Record<ReturnType<typeof stationPlacement>, number> = {
  orbital: 0,
  surface: 1,
  unknown: 2,
}

function compareWithinBody(left: ScoredStation, right: ScoredStation): number {
  return (
    PLACEMENT_ORDER[stationPlacement(left.station)] -
      PLACEMENT_ORDER[stationPlacement(right.station)] ||
    compareBySupercruise(left.station.distanceToArrivalLs, right.station.distanceToArrivalLs) ||
    right.score - left.score ||
    left.station.name.localeCompare(right.station.name)
  )
}
