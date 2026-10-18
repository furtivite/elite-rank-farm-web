import type {
  MissionBodyGroup,
  MissionStationGroup,
  MissionSystemGroup,
} from '@/entities/mission-store/lib/groupMissions'

export type CommanderPosition = {
  systemName: string
  stationName: string | null
}

function sameName(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function moveToFront<T>(items: readonly T[], first: (item: T) => boolean): T[] {
  const head: T[] = []
  const tail: T[] = []
  for (const item of items) {
    ;(first(item) ? head : tail).push(item)
  }
  return [...head, ...tail]
}

export function pinCurrentPosition(
  groups: readonly MissionSystemGroup[],
  position: CommanderPosition | null,
): MissionSystemGroup[] {
  if (position === null) {
    return [...groups]
  }

  const { systemName, stationName } = position

  const pinned = moveToFront(groups, (group) => sameName(group.systemName, systemName))
  const [current] = pinned

  if (stationName === null || current === undefined || !sameName(current.systemName, systemName)) {
    return pinned
  }

  const hasStation = (body: MissionBodyGroup) =>
    body.stations.some((station) => sameName(station.stationName, stationName))

  const bodies = moveToFront(current.bodies, hasStation).map((body) =>
    hasStation(body)
      ? {
          ...body,
          stations: moveToFront(body.stations, (station: MissionStationGroup) =>
            sameName(station.stationName, stationName),
          ),
        }
      : body,
  )

  return [{ ...current, bodies }, ...pinned.slice(1)]
}

export type OrderSnapshot = {
  systems: string[]
  bodies: Record<string, string[]>
  stations: Record<string, string[]>
}

export function snapshotOrder(groups: readonly MissionSystemGroup[]): OrderSnapshot {
  const snapshot: OrderSnapshot = { systems: [], bodies: {}, stations: {} }

  for (const system of groups) {
    snapshot.systems.push(system.key)
    snapshot.bodies[system.key] = system.bodies.map((body) => body.key)
    for (const body of system.bodies) {
      snapshot.stations[body.key] = body.stations.map((station) => station.key)
    }
  }

  return snapshot
}

function bySnapshot<T extends { key: string }>(
  items: readonly T[],
  order: string[] | undefined,
): T[] {
  if (order === undefined) {
    return [...items]
  }

  const position = new Map(order.map((key, index) => [key, index]))
  return [...items].sort(
    (left, right) => (position.get(left.key) ?? Infinity) - (position.get(right.key) ?? Infinity),
  )
}

export function applySnapshotOrder(
  groups: readonly MissionSystemGroup[],
  snapshot: OrderSnapshot,
): MissionSystemGroup[] {
  return bySnapshot(groups, snapshot.systems).map((system) => ({
    ...system,
    bodies: bySnapshot(system.bodies, snapshot.bodies[system.key]).map((body) => ({
      ...body,
      stations: bySnapshot(body.stations, snapshot.stations[body.key]),
    })),
  }))
}

export function pinChosenSystem(
  groups: readonly MissionSystemGroup[],
  systemKey: string | null,
): MissionSystemGroup[] {
  if (systemKey === null) {
    return [...groups]
  }

  return moveToFront(groups, (group) => group.key === systemKey)
}
