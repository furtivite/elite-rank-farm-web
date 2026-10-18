import type { JournalMission, MissionSystemGroup, ReturnLeg } from '@/entities/mission-store'
import { returnLegKey } from '@/entities/mission-store'

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export function hasUncollectedDepot(missions: readonly JournalMission[]): boolean {
  return missions.some(
    (mission) =>
      mission.cargo !== undefined &&
      mission.cargo.collected !== undefined &&
      mission.cargo.collected < mission.cargo.total,
  )
}

export function hasReturnLegInBasket(
  systems: readonly MissionSystemGroup[],
  legs: Readonly<Record<string, ReturnLeg>>,
): boolean {
  for (const system of systems) {
    for (const body of system.bodies) {
      for (const station of body.stations) {
        if (legs[returnLegKey(system.systemName, station.stationName)] !== undefined) {
          return true
        }
      }
    }
  }

  return false
}

export function cargoTonsBySystem(missions: readonly JournalMission[]): Map<string, number> {
  const tons = new Map<string, number>()

  for (const mission of missions) {
    if (mission.cargo === undefined || mission.destinationSystem === undefined) {
      continue
    }

    const left = mission.cargo.total - (mission.cargo.delivered ?? 0)
    if (left <= 0) {
      continue
    }

    const key = normalize(mission.destinationSystem)
    tons.set(key, (tons.get(key) ?? 0) + left)
  }

  return tons
}

export function cargoTonsOf(
  systemName: string,
  tons: ReadonlyMap<string, number> | undefined,
): number {
  return tons?.get(normalize(systemName)) ?? 0
}
