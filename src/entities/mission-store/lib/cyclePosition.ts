import type { JournalMission } from '@/entities/mission-store/model/journalTypes'
import type { CycleLeg, MissionCycle } from '@/entities/mission-store/lib/missionCycles'

export type CyclePosition = {
  systemName?: string | null
  stationName?: string | null
}

export function currentLegOfCycle(
  cycle: MissionCycle,
  missions: readonly JournalMission[],
  position: CyclePosition = {},
): CycleLeg | undefined {
  if (cycle.legs.length === 0) {
    return undefined
  }

  const inHold = legInHold(cycle, missions)
  if (inHold !== undefined) {
    return inHold
  }

  const { systemName, stationName } = position
  if (systemName && stationName) {
    const here = cycle.legs.find(
      (leg) => leg.from.systemName === systemName && leg.from.stationName === stationName,
    )
    if (here !== undefined) {
      return here
    }
  }

  if (systemName) {
    const inSystem = cycle.legs.find((leg) => leg.from.systemName === systemName)
    if (inSystem !== undefined) {
      return inSystem
    }
  }

  return cycle.legs[0]
}

function legInHold(cycle: MissionCycle, missions: readonly JournalMission[]): CycleLeg | undefined {
  const byId = new Map(missions.map((mission) => [mission.missionId, mission]))

  return cycle.legs.find((leg) => {
    const cargo = byId.get(leg.missionId)?.cargo
    if (cargo === undefined) {
      return false
    }
    const collected = cargo.collected ?? 0
    const delivered = cargo.delivered ?? 0
    const lost = cargo.lost ?? 0
    return collected - delivered - lost > 0
  })
}

export function isOnEmptyReturn(
  cycle: MissionCycle,
  missions: readonly JournalMission[],
  position: CyclePosition = {},
): boolean {
  const last = cycle.stations[cycle.stations.length - 1]
  if (!cycle.emptyReturn || last === undefined || !position.systemName) {
    return false
  }
  if (last.systemName !== position.systemName) {
    return false
  }

  return legInHold(cycle, missions) === undefined
}
