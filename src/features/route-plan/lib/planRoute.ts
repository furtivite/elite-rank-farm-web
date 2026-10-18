import { estimateJumps, type Coords3D } from '@/entities/galaxy-data'
import {
  systemStopSeconds,
  type MissionSystemGroup,
  type StationFactsByStationId,
} from '@/entities/mission-store'
import { cargoTonsOf } from '@/features/route-plan/lib/routeReasons'
import { improve, nearestFirst, type Candidate } from '@/features/route-plan/lib/routeOrder'
import { DOCKING_SECONDS, JUMP_SECONDS, supercruiseSeconds } from '@/shared/lib/travelTime'

export type RouteStop = {
  systemKey: string
  systemName: string
  jumps: number
  seconds: number
  missions: number
  cargoT: number
}

export type RouteReturn = {
  systemName: string
  stationName: string | null
  jumps: number
  seconds: number
}

export type RoutePlan = {
  stops: RouteStop[]
  returnLeg: RouteReturn
  seconds: number
  skipped: string[]
}

export type RouteContext = {
  hasUncollectedDepot: boolean
  hasReturnLeg: boolean
  cargoTonsBySystem?: ReadonlyMap<string, number>
  start: {
    systemName: string
    stationName: string | null
    distanceToArrivalLs?: number
  }
}

export function planRoute(
  systems: readonly MissionSystemGroup[],
  coordsById: ReadonlyMap<string, Coords3D>,
  origin: { coords: Coords3D; jumpRangeLy: number } | null,
  stationFacts: StationFactsByStationId | undefined,
  context: RouteContext,
): RoutePlan | null {
  if (origin === null) {
    return null
  }

  if (!context.hasUncollectedDepot && !context.hasReturnLeg) {
    return null
  }

  const candidates: Candidate[] = []
  const skipped: string[] = []

  for (const system of systems) {
    const toHandIn = system.missionCount - system.completedCount - system.awaitingCount
    if (toHandIn <= 0) {
      continue
    }

    const coords = system.systemId === undefined ? undefined : coordsById.get(system.systemId)
    if (coords === undefined) {
      skipped.push(system.systemName)
      continue
    }

    candidates.push({
      systemKey: system.key,
      systemName: system.systemName,
      coords,
      stopSeconds: systemStopSeconds(system, stationFacts).seconds,
      missions: toHandIn,
      cargoT: cargoTonsOf(system.systemName, context.cargoTonsBySystem),
    })
  }

  if (candidates.length === 0) {
    return null
  }

  const hop = (from: Coords3D, to: Coords3D): number =>
    estimateJumps(from, to, origin.jumpRangeLy)?.minJumps ?? 1

  const order = improve(nearestFirst(candidates, origin.coords, hop), origin.coords, hop)

  const stops: RouteStop[] = []
  let seconds = 0
  let at = origin.coords

  for (const stop of order) {
    const jumps = hop(at, stop.coords)
    const legSeconds = jumps * JUMP_SECONDS + stop.stopSeconds

    stops.push({
      systemKey: stop.systemKey,
      systemName: stop.systemName,
      jumps,
      seconds: legSeconds,
      missions: stop.missions,
      cargoT: stop.cargoT,
    })

    seconds += legSeconds
    at = stop.coords
  }

  const returnLeg = closeCircle(at, origin, context.start, hop)

  return { stops, returnLeg, seconds: seconds + returnLeg.seconds, skipped }
}

function closeCircle(
  from: Coords3D,
  origin: { coords: Coords3D },
  start: RouteContext['start'],
  hop: (a: Coords3D, b: Coords3D) => number,
): RouteReturn {
  const jumps = hop(from, origin.coords)
  const docking =
    start.stationName === null
      ? 0
      : (supercruiseSeconds(start.distanceToArrivalLs) ?? 0) + DOCKING_SECONDS

  return {
    systemName: start.systemName,
    stationName: start.stationName,
    jumps,
    seconds: jumps * JUMP_SECONDS + docking,
  }
}
