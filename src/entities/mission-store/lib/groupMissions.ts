import { jumpPenalty, type JumpEstimate } from '@/entities/galaxy-data'
import type { StoredMission } from '@/entities/mission-store/model/types'

export type MissionStationGroup = {
  key: string
  stationName: string
  stationId?: string
  missions: StoredMission[]
  completedCount: number
  awaitingCount: number
}

export type MissionBodyGroup = {
  key: string
  bodyName: string | null
  stations: MissionStationGroup[]
  missionCount: number
}

export type MissionSystemGroup = {
  key: string
  systemName: string
  systemId?: string
  bodies: MissionBodyGroup[]
  missionCount: number
  completedCount: number
  awaitingCount: number
  stationCount: number
  bodyCount: number
  maxMissionsAtOneStation: number
  jumps: JumpEstimate | null
}

export type JumpsBySystemId = ReadonlyMap<string, JumpEstimate>

export type StationDistanceByStationId = ReadonlyMap<string, number>

export type MissionOrderContext = {
  jumps?: JumpsBySystemId
  stationDistanceLs?: StationDistanceByStationId
  canLandAt?: (station: MissionStationGroup) => boolean
  atOtherStar?: (station: MissionStationGroup) => boolean
}

function landsLast(
  station: MissionStationGroup,
  canLandAt: ((station: MissionStationGroup) => boolean) | undefined,
): boolean {
  return canLandAt === undefined ? false : !canLandAt(station)
}

function bodyLandsLast(
  body: MissionBodyGroup,
  canLandAt: ((station: MissionStationGroup) => boolean) | undefined,
): boolean {
  if (canLandAt === undefined || body.stations.length === 0) {
    return false
  }

  return body.stations.every((station) => !canLandAt(station))
}

function systemLandsLast(
  system: MissionSystemGroup,
  canLandAt: ((station: MissionStationGroup) => boolean) | undefined,
): boolean {
  if (canLandAt === undefined) {
    return false
  }

  const stations = system.bodies.flatMap((body) => body.stations)

  return stations.length > 0 && stations.every((station) => !canLandAt(station))
}

function stationDistance(
  station: MissionStationGroup,
  distances: StationDistanceByStationId | undefined,
): number {
  if (station.stationId === undefined || distances === undefined) {
    return Infinity
  }

  return distances.get(station.stationId) ?? Infinity
}

function stationKey(mission: StoredMission): string {
  return mission.targetStationId ?? `${mission.targetSystem}::${mission.targetStation}`
}

function systemKey(mission: StoredMission): string {
  return mission.targetSystemId ?? mission.targetSystem
}

export function groupMissions(
  missions: readonly StoredMission[],
  context: MissionOrderContext = {},
): MissionSystemGroup[] {
  const { jumps, stationDistanceLs, canLandAt, atOtherStar } = context
  const staysUp =
    canLandAt === undefined && atOtherStar === undefined
      ? undefined
      : (station: MissionStationGroup) =>
          (canLandAt?.(station) ?? true) && atOtherStar?.(station) !== true
  const systems = new Map<string, MissionSystemGroup>()
  const bodies = new Map<string, MissionBodyGroup>()
  const stations = new Map<string, MissionStationGroup>()

  for (const mission of missions) {
    const sysKey = systemKey(mission)
    let system = systems.get(sysKey)
    if (!system) {
      system = {
        key: sysKey,
        systemName: mission.targetSystem,
        systemId: mission.targetSystemId,
        bodies: [],
        missionCount: 0,
        completedCount: 0,
        awaitingCount: 0,
        stationCount: 0,
        bodyCount: 0,
        maxMissionsAtOneStation: 0,
        jumps:
          mission.targetSystemId === undefined
            ? null
            : (jumps?.get(mission.targetSystemId) ?? null),
      }
      systems.set(sysKey, system)
    }

    const bodyName = mission.targetBody ?? null
    const bodyKey = `${sysKey}::${bodyName ?? ''}`
    let body = bodies.get(bodyKey)
    if (!body) {
      body = { key: bodyKey, bodyName, stations: [], missionCount: 0 }
      bodies.set(bodyKey, body)
      system.bodies.push(body)
    }

    const stKey = `${bodyKey}::${stationKey(mission)}`
    let station = stations.get(stKey)
    if (!station) {
      station = {
        key: stKey,
        stationName: mission.targetStation,
        stationId: mission.targetStationId,
        missions: [],
        completedCount: 0,
        awaitingCount: 0,
      }
      stations.set(stKey, station)
      body.stations.push(station)
    }

    station.missions.push(mission)
    body.missionCount += 1
    system.missionCount += 1
    if (mission.completed === true) {
      station.completedCount += 1
      system.completedCount += 1
    }
    if (mission.awaitingCargo === true) {
      station.awaitingCount += 1
      system.awaitingCount += 1
    }
  }

  for (const system of systems.values()) {
    system.bodyCount = system.bodies.length
    system.stationCount = system.bodies.reduce((sum, body) => sum + body.stations.length, 0)
    system.maxMissionsAtOneStation = system.bodies.reduce(
      (max, body) =>
        body.stations.reduce((inner, station) => Math.max(inner, worthFlying(station)), max),
      0,
    )

    for (const body of system.bodies) {
      body.stations.sort(
        (left, right) =>
          Number(landsLast(left, staysUp)) - Number(landsLast(right, staysUp)) ||
          Number(idle(left)) - Number(idle(right)) ||
          stationDistance(left, stationDistanceLs) - stationDistance(right, stationDistanceLs) ||
          worthFlying(right) - worthFlying(left) ||
          left.stationName.localeCompare(right.stationName),
      )
      for (const station of body.stations) {
        station.missions.sort(
          (left, right) =>
            Number(left.completed === true) - Number(right.completed === true) ||
            left.addedAt.localeCompare(right.addedAt),
        )
      }
    }

    system.bodies.sort((left, right) => {
      const byLanding = Number(bodyLandsLast(left, staysUp)) - Number(bodyLandsLast(right, staysUp))
      if (byLanding !== 0) return byLanding
      if (left.bodyName === null) return 1
      if (right.bodyName === null) return -1
      return right.missionCount - left.missionCount || left.bodyName.localeCompare(right.bodyName)
    })
  }

  return [...systems.values()].sort(
    (left, right) =>
      Number(systemLandsLast(left, staysUp)) - Number(systemLandsLast(right, staysUp)) ||
      Number(left.awaitingCount === left.missionCount) -
        Number(right.awaitingCount === right.missionCount) ||
      jumpPenalty(left.jumps) - jumpPenalty(right.jumps) ||
      right.missionCount - right.awaitingCount - (left.missionCount - left.awaitingCount) ||
      right.maxMissionsAtOneStation - left.maxMissionsAtOneStation ||
      left.stationCount - right.stationCount ||
      left.bodyCount - right.bodyCount ||
      left.systemName.localeCompare(right.systemName),
  )
}

export function worthFlying(station: MissionStationGroup): number {
  return station.missions.length - station.awaitingCount
}

function idle(station: MissionStationGroup): boolean {
  return station.awaitingCount === station.missions.length
}

export function countMissionsBySystemId(missions: readonly StoredMission[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const mission of missions) {
    if (mission.targetSystemId === undefined) {
      continue
    }
    counts.set(mission.targetSystemId, (counts.get(mission.targetSystemId) ?? 0) + 1)
  }

  return counts
}

export function countMissionsByStationId(missions: readonly StoredMission[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const mission of missions) {
    if (mission.targetStationId === undefined) {
      continue
    }
    counts.set(mission.targetStationId, (counts.get(mission.targetStationId) ?? 0) + 1)
  }

  return counts
}
