import {
  currentLegOfCycle,
  findMissionCycles,
  isOnEmptyReturn,
  type CyclePosition,
  type CycleStation,
  type JournalMission,
  type MissionCycle,
} from '@/entities/mission-store'

export type RingStep = {
  route: string[]
  from: CycleStation
  to: CycleStation
  emptyReturn: boolean
}

function stepOf(
  cycle: MissionCycle,
  missions: readonly JournalMission[],
  position: CyclePosition,
): RingStep | null {
  const first = cycle.stations[0]
  const last = cycle.stations[cycle.stations.length - 1]
  if (first === undefined || last === undefined) {
    return null
  }
  const route = [...cycle.stations, first].map((station) => station.stationName)

  if (isOnEmptyReturn(cycle, missions, position)) {
    return { route, from: last, to: first, emptyReturn: true }
  }

  const leg = currentLegOfCycle(cycle, missions, position)
  return leg === undefined ? null : { route, from: leg.from, to: leg.to, emptyReturn: false }
}

export function ringStep(
  missions: readonly JournalMission[],
  position: CyclePosition = {},
): RingStep | null {
  const cycles = findMissionCycles(missions)
  const here = cycles.find((cycle) =>
    cycle.stations.some((station) => station.systemName === position.systemName),
  )
  const cycle = here ?? cycles[0]

  return cycle === undefined ? null : stepOf(cycle, missions, position)
}
