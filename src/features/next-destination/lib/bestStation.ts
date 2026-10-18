import { travelSeconds } from '@/shared/lib/travelTime'
import {
  worthFlying,
  type MissionStationFacts,
  type MissionStationGroup,
  type MissionSystemGroup,
  type StationFactsByStationId,
} from '@/entities/mission-store'

export function sameName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

export function isSameSystem(
  system: MissionSystemGroup,
  currentSystemName: string | null | undefined,
): boolean {
  if (system.jumps !== null) {
    return system.jumps.minJumps === 0
  }

  return currentSystemName != null && sameName(system.systemName, currentSystemName)
}

export function factsOf(
  station: MissionStationGroup,
  stationFacts: StationFactsByStationId | undefined,
): MissionStationFacts | undefined {
  return station.stationId === undefined ? undefined : stationFacts?.get(station.stationId)
}

export function bestStation(
  system: MissionSystemGroup,
  stationFacts: StationFactsByStationId | undefined,
): { station: MissionStationGroup; bodyName: string | null } | null {
  let best: { station: MissionStationGroup; bodyName: string | null } | null = null
  let bestDistance = Infinity

  for (const body of system.bodies) {
    for (const station of body.stations) {
      const distance = factsOf(station, stationFacts)?.distanceToArrivalLs ?? Infinity
      if (best === null) {
        best = { station, bodyName: body.bodyName }
        bestDistance = distance
        continue
      }

      const better =
        worthFlying(station) > worthFlying(best.station) ||
        (worthFlying(station) === worthFlying(best.station) &&
          (distance < bestDistance ||
            (distance === bestDistance &&
              station.stationName.localeCompare(best.station.stationName) < 0)))

      if (better) {
        best = { station, bodyName: body.bodyName }
        bestDistance = distance
      }
    }
  }

  return best
}

export function mostMissionsAnywhere(
  groups: readonly MissionSystemGroup[],
  stationFacts: StationFactsByStationId | undefined,
): { station: MissionStationGroup; bodyName: string | null } | null {
  type Candidate = {
    station: MissionStationGroup
    bodyName: string | null
    rate: number | null
    jumps: number
    distanceLs: number
  }

  let best: Candidate | null = null

  for (const system of groups) {
    const jumps = system.jumps === null ? 1 : system.jumps.minJumps

    for (const body of system.bodies) {
      for (const station of body.stations) {
        const distanceToArrivalLs = factsOf(station, stationFacts)?.distanceToArrivalLs
        const seconds = travelSeconds({ jumps, distanceToArrivalLs })
        const candidate: Candidate = {
          station,
          bodyName: body.bodyName,
          rate: seconds === null ? null : worthFlying(station) / seconds,
          jumps,
          distanceLs: distanceToArrivalLs ?? Infinity,
        }

        if (best === null || betterCandidate(candidate, best)) {
          best = candidate
        }
      }
    }
  }

  return best === null ? null : { station: best.station, bodyName: best.bodyName }

  function betterCandidate(candidate: Candidate, current: Candidate): boolean {
    if (candidate.rate !== null && current.rate === null) {
      return true
    }
    if (candidate.rate === null && current.rate !== null) {
      return false
    }

    if (candidate.rate !== null && current.rate !== null && candidate.rate !== current.rate) {
      return candidate.rate > current.rate
    }

    if (worthFlying(candidate.station) !== worthFlying(current.station)) {
      return worthFlying(candidate.station) > worthFlying(current.station)
    }
    if (candidate.jumps !== current.jumps) {
      return candidate.jumps < current.jumps
    }

    return candidate.distanceLs < current.distanceLs
  }
}
