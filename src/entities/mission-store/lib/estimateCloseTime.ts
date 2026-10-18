import type { MissionSystemGroup } from '@/entities/mission-store/lib/groupMissions'
import type { StationFactsByStationId } from '@/entities/mission-store/model/useMissionStationFacts'
import { DOCKING_SECONDS, JUMP_SECONDS, supercruiseSeconds } from '@/shared/lib/travelTime'

export type CloseTimeEstimate = {
  seconds: number
  unknownStations: number
  stations: number
  missions: number
}

export function systemStopSeconds(
  system: MissionSystemGroup,
  stationFacts: StationFactsByStationId | undefined,
): { seconds: number; unknownStations: number; stations: number } {
  let seconds = 0
  let unknownStations = 0
  let stations = 0

  for (const body of system.bodies) {
    for (const station of body.stations) {
      stations += 1

      const facts =
        station.stationId === undefined ? undefined : stationFacts?.get(station.stationId)
      const supercruise = supercruiseSeconds(facts?.distanceToArrivalLs)

      if (supercruise === null) {
        unknownStations += 1
        continue
      }

      seconds += supercruise + DOCKING_SECONDS
    }
  }

  return { seconds, unknownStations, stations }
}

export function estimateSystemCloseTime(
  system: MissionSystemGroup,
  stationFacts: StationFactsByStationId | undefined,
): CloseTimeEstimate {
  const jumps = system.jumps === null ? 1 : system.jumps.minJumps
  const stop = systemStopSeconds(system, stationFacts)

  return {
    seconds: jumps * JUMP_SECONDS + stop.seconds,
    unknownStations: stop.unknownStations,
    stations: stop.stations,
    missions: system.missionCount,
  }
}

export function estimateCloseTime(
  systems: readonly MissionSystemGroup[],
  stationFacts: StationFactsByStationId | undefined,
): CloseTimeEstimate {
  return systems.reduce<CloseTimeEstimate>(
    (total, system) => {
      const part = estimateSystemCloseTime(system, stationFacts)

      return {
        seconds: total.seconds + part.seconds,
        unknownStations: total.unknownStations + part.unknownStations,
        stations: total.stations + part.stations,
        missions: total.missions + part.missions,
      }
    },
    { seconds: 0, unknownStations: 0, stations: 0, missions: 0 },
  )
}

export function closeTimeMinutes(estimate: CloseTimeEstimate): number {
  return Math.max(1, Math.round(estimate.seconds / 60))
}
