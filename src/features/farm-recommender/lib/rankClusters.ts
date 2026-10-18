import type { StoredMission } from '@/entities/mission-store'
import type { StationRatingsMap } from '@/entities/station-rating'
import { buildScoredGroups } from '@/features/farm-recommender/lib/buildScoredGroups'
import type { RawSystemGroup } from '@/features/farm-recommender/model/types'
import type { Translate } from '@/shared/lib/i18n'

export type ClusterSearchResult = {
  clusterId: string | null
  name: string
  groups: readonly RawSystemGroup[]
}

export type ClusterSummary = {
  clusterId: string | null
  name: string
  systemCount: number
  stationCount: number
  bestScore: number
  topScore: number
}

export const CLUSTER_TOP_STATIONS = 5

export function rankClusters(
  t: Translate,
  entries: readonly ClusterSearchResult[],
  ratings: StationRatingsMap,
  missions: readonly StoredMission[] = [],
  now?: number,
): ClusterSummary[] {
  const summaries = entries.map((entry): ClusterSummary => {
    const groups = buildScoredGroups(t, entry.groups, ratings, missions, now)
    const scores = groups
      .flatMap((group) =>
        group.stations
          .filter((station) => station.rating !== 'blocked')
          .map((station) => station.score),
      )
      .sort((a, b) => b - a)

    return {
      clusterId: entry.clusterId,
      name: entry.name,
      systemCount: groups.length,
      stationCount: scores.length,
      bestScore: scores[0] ?? 0,
      topScore: scores.slice(0, CLUSTER_TOP_STATIONS).reduce((sum, score) => sum + score, 0),
    }
  })

  return summaries.sort((a, b) => {
    const aEmpty = a.stationCount === 0
    const bEmpty = b.stationCount === 0
    if (aEmpty !== bEmpty) {
      return aEmpty ? 1 : -1
    }

    return b.topScore - a.topScore || b.bestScore - a.bestScore || a.name.localeCompare(b.name)
  })
}
