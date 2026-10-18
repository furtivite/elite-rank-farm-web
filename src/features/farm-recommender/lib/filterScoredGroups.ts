import type { StationFaction } from '@/entities/galaxy-data'
import type { FarmMode, ScoredSystemGroup } from '@/features/farm-recommender/model/types'

export type ResultsFilter = {
  system: string
  station: string
  ownSideOnly: boolean
}

export const EMPTY_RESULTS_FILTER: ResultsFilter = {
  system: '',
  station: '',
  ownSideOnly: false,
}

const OWN_ALLEGIANCE: Record<FarmMode, StationFaction['allegiance']> = {
  empire: 'Empire',
  federal: 'Federation',
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function filterScoredGroups(
  groups: readonly ScoredSystemGroup[],
  filter: ResultsFilter,
  farmMode?: FarmMode,
): ScoredSystemGroup[] {
  const system = normalize(filter.system)
  const station = normalize(filter.station)
  const ownAllegiance =
    filter.ownSideOnly && farmMode !== undefined ? OWN_ALLEGIANCE[farmMode] : null

  if (system === '' && station === '' && ownAllegiance === null) {
    return [...groups]
  }

  const filtered: ScoredSystemGroup[] = []

  for (const group of groups) {
    if (system !== '' && !group.systemName.toLowerCase().includes(system)) {
      continue
    }

    const stations = group.stations.filter((entry) => {
      if (station !== '' && !entry.station.name.toLowerCase().includes(station)) {
        return false
      }

      return (
        ownAllegiance === null || entry.station.controllingFaction?.allegiance === ownAllegiance
      )
    })

    if (stations.length === 0) {
      continue
    }

    filtered.push({
      ...group,
      stations,
      bestScore: Math.max(...stations.map((entry) => entry.score)),
    })
  }

  return filtered
}

export type ResultsSort = 'score' | 'name-asc' | 'name-desc'

export const DEFAULT_RESULTS_SORT: ResultsSort = 'score'

export function sortScoredGroups(
  groups: readonly ScoredSystemGroup[],
  sort: ResultsSort,
): ScoredSystemGroup[] {
  const byName = (left: ScoredSystemGroup, right: ScoredSystemGroup) =>
    left.systemName.localeCompare(right.systemName, undefined, { numeric: true })

  return [...groups].sort((left, right) => {
    if (sort === 'name-asc') {
      return byName(left, right)
    }
    if (sort === 'name-desc') {
      return byName(right, left)
    }

    return right.bestScore - left.bestScore || byName(left, right)
  })
}
