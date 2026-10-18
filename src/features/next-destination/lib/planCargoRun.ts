import { isShuttling, type PositionVisit } from '@/entities/commander-state'
import { cargoProgress, cargoSource, type JournalMission } from '@/entities/mission-store'

export type CargoPickupTarget = {
  systemName: string
  stationName: string
  remaining: number
  commodities: string[]
  missions: number
}

export type LocalDelivery = {
  systemName: string
  stationName: string
  missions: number
}

export type CargoRunPlan = {
  pickup: CargoPickupTarget
  local: LocalDelivery | null
  shuttle: boolean
}

export type CargoRunContext = {
  currentSystemName?: string | null
  history?: readonly PositionVisit[]
}

function sameName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

export function planCargoRun(
  missions: readonly JournalMission[],
  context: CargoRunContext = {},
): CargoRunPlan | null {
  const { currentSystemName = null, history = [] } = context

  const byStation = new Map<string, CargoPickupTarget>()
  const localByStation = new Map<string, LocalDelivery>()

  for (const mission of missions) {
    const progress = mission.cargo === undefined ? null : cargoProgress(mission.cargo, undefined)

    if (progress !== null && progress.inHold > 0) {
      return null
    }

    const awaitsHandover = progress === null || progress.remaining === 0
    if (awaitsHandover) {
      const system = mission.destinationSystem
      const station = mission.destinationStation

      const isHere =
        currentSystemName !== null && system !== undefined && sameName(system, currentSystemName)

      if (!isHere) {
        return null
      }

      if (station !== undefined && system !== undefined) {
        const key = `${system} ${station}`
        const existing = localByStation.get(key)
        if (existing === undefined) {
          localByStation.set(key, { systemName: system, stationName: station, missions: 1 })
        } else {
          existing.missions += 1
        }
      }
      continue
    }

    const source = cargoSource(mission)
    if (source === null) {
      continue
    }
    const { systemName, stationName } = source

    const key = `${systemName} ${stationName}`
    const existing = byStation.get(key)
    const commodity = mission.cargo?.commodityLocalised ?? mission.cargo?.commodity

    if (existing === undefined) {
      byStation.set(key, {
        systemName,
        stationName,
        remaining: progress!.remaining,
        commodities: commodity === undefined ? [] : [commodity],
        missions: 1,
      })
      continue
    }

    existing.remaining += progress!.remaining
    existing.missions += 1
    if (commodity !== undefined && !existing.commodities.includes(commodity)) {
      existing.commodities.push(commodity)
    }
  }

  const candidates = [...byStation.values()]
  if (candidates.length === 0) {
    return null
  }

  candidates.sort(
    (left, right) =>
      right.remaining - left.remaining ||
      left.systemName.localeCompare(right.systemName) ||
      left.stationName.localeCompare(right.stationName),
  )
  const pickup = candidates[0]!

  const locals = [...localByStation.values()].sort(
    (left, right) =>
      right.missions - left.missions || left.stationName.localeCompare(right.stationName),
  )

  return {
    pickup,
    local: locals[0] ?? null,
    shuttle:
      currentSystemName !== null && isShuttling(history, currentSystemName, pickup.systemName),
  }
}
