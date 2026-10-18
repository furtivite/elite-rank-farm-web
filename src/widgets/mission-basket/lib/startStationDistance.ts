import {
  type CommanderPosition,
  type MissionSystemGroup,
  type StationFactsByStationId,
} from '@/entities/mission-store'
import { sameName } from '@/widgets/mission-basket/lib/sameName'

export function startStationDistance(
  systems: readonly MissionSystemGroup[],
  position: CommanderPosition | null,
  stationFacts: StationFactsByStationId,
): number | undefined {
  if (position === null || position.stationName === null) {
    return undefined
  }

  for (const system of systems) {
    if (!sameName(system.systemName, position.systemName)) {
      continue
    }
    for (const body of system.bodies) {
      for (const station of body.stations) {
        if (
          station.stationId !== undefined &&
          sameName(station.stationName, position.stationName)
        ) {
          return stationFacts.get(station.stationId)?.distanceToArrivalLs
        }
      }
    }
  }

  return undefined
}
