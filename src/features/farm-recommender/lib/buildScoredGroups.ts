import {
  countMissionsByStationId,
  countMissionsBySystemId,
  type StoredMission,
} from '@/entities/mission-store'
import type { StationRatingsMap } from '@/entities/station-rating'
import { compareBySupercruise } from '@/shared/lib/supercruiseOrder'
import { scoreStation } from '@/features/farm-recommender/lib/scoreStation'
import type { Translate } from '@/shared/lib/i18n'
import type {
  FarmMode,
  RawSystemGroup,
  ScoredStation,
  ScoredSystemGroup,
} from '@/features/farm-recommender/model/types'

export function buildScoredGroups(
  t: Translate,
  rawGroups: readonly RawSystemGroup[],
  ratings: StationRatingsMap,
  missions: readonly StoredMission[] = [],
  now?: number,
  farmMode?: FarmMode,
): ScoredSystemGroup[] {
  const groups: ScoredSystemGroup[] = []
  const missionCounts = countMissionsByStationId(missions)
  const systemMissionCounts = countMissionsBySystemId(missions)

  for (const rawGroup of rawGroups) {
    const scoredStations: ScoredStation[] = []

    for (const station of rawGroup.stations) {
      const entry = ratings[station.id]

      const missionCount = missionCounts.get(station.id) ?? 0
      const { score, reasons } = scoreStation({
        t,
        station,
        rating: entry?.rating,
        missionCount,
        systemMissionCount: systemMissionCounts.get(rawGroup.systemId) ?? 0,
        systemUpdatedAt: rawGroup.updatedAt,
        now,
        farmMode,
      })

      scoredStations.push({
        station,
        factions: rawGroup.systemFactionSummary,
        factionsDataState: 'unknown',
        rating: entry?.rating,
        missionCount,
        score,
        reasons,
      })
    }

    const usableStations = scoredStations.filter((scored) => scored.rating !== 'blocked')
    if (usableStations.length === 0) {
      continue
    }

    scoredStations.sort(
      (a, b) =>
        compareBySupercruise(a.station.distanceToArrivalLs, b.station.distanceToArrivalLs) ||
        b.score - a.score ||
        a.station.name.localeCompare(b.station.name),
    )

    groups.push({
      systemId: rawGroup.systemId,
      systemName: rawGroup.systemName,
      distanceLy: rawGroup.distanceLy,
      stations: scoredStations,
      hiddenNoBoard: rawGroup.hiddenNoBoard,
      updatedAt: rawGroup.updatedAt,
      updatedBy: rawGroup.updatedBy,
      bestScore: usableStations.reduce((best, scored) => Math.max(best, scored.score), -Infinity),
      missionCount:
        systemMissionCounts.get(rawGroup.systemId) ??
        scoredStations.reduce((sum, scored) => sum + scored.missionCount, 0),
    })
  }

  groups.sort((a, b) => b.bestScore - a.bestScore || a.distanceLy - b.distanceLy)

  return groups
}
