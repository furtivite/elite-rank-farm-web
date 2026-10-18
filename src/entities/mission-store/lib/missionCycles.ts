import { cargoProgress } from '@/entities/mission-store/lib/cargoProgress'
import { cargoSource } from '@/entities/mission-store/lib/cargoSource'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'
import { openChains, simpleCycles } from '@/entities/mission-store/lib/cycleGraph'

export type { CyclePosition } from '@/entities/mission-store/lib/cyclePosition'
export { currentLegOfCycle, isOnEmptyReturn } from '@/entities/mission-store/lib/cyclePosition'

export type CycleStation = {
  systemName: string
  stationName: string
}

export type CycleLeg = {
  missionId: string
  from: CycleStation
  to: CycleStation
}

export type MissionCycle = {
  id: string
  stations: CycleStation[]
  legs: CycleLeg[]
  emptyReturn: boolean
}

export function cycleStationKey(station: CycleStation): string {
  return `${station.systemName}|${station.stationName}`
}

function stationOf(systemName: string, stationName: string): CycleStation {
  return { systemName, stationName }
}

function legsOf(missions: readonly JournalMission[]): CycleLeg[] {
  const legs: CycleLeg[] = []

  for (const mission of missions) {
    const source = cargoSource(mission)
    const originSystem = source?.systemName ?? mission.originSystem
    const originStation = source?.stationName ?? mission.originStation
    const { destinationSystem, destinationStation } = mission
    if (!originSystem || !originStation || !destinationSystem || !destinationStation) {
      continue
    }

    const from = stationOf(originSystem, originStation)
    const to = stationOf(destinationSystem, destinationStation)
    if (cycleStationKey(from) === cycleStationKey(to)) {
      continue
    }

    legs.push({ missionId: mission.missionId, from, to })
  }

  return legs
}

function goodsLeft(mission: JournalMission): { toHaul: number; atDepot: number } {
  if (mission.cargo === undefined) {
    return { toHaul: 0, atDepot: 0 }
  }
  const progress = cargoProgress(mission.cargo, undefined)
  return { toHaul: progress.remaining, atDepot: progress.toCollect }
}

export function findMissionCycles(missions: readonly JournalMission[]): MissionCycle[] {
  const legs = legsOf(missions)
  if (legs.length < 2) {
    return []
  }

  const adjacency = new Map<string, Set<string>>()
  const stations = new Map<string, CycleStation>()
  const legsByEdge = new Map<string, CycleLeg[]>()

  for (const leg of legs) {
    const from = cycleStationKey(leg.from)
    const to = cycleStationKey(leg.to)
    stations.set(from, leg.from)
    stations.set(to, leg.to)

    const targets = adjacency.get(from) ?? new Set<string>()
    targets.add(to)
    adjacency.set(from, targets)

    const edge = `${from}>${to}`
    legsByEdge.set(edge, [...(legsByEdge.get(edge) ?? []), leg])
  }

  const found = simpleCycles(adjacency).sort(
    (left, right) => left.length - right.length || left.join('>').localeCompare(right.join('>')),
  )

  const taken = new Set<string>()
  const cycles: MissionCycle[] = []

  for (const ring of found) {
    if (ring.some((node) => taken.has(node))) {
      continue
    }
    for (const node of ring) {
      taken.add(node)
    }

    const ringLegs: CycleLeg[] = []
    for (let index = 0; index < ring.length; index += 1) {
      const from = ring[index]
      const to = ring[(index + 1) % ring.length]
      ringLegs.push(...(legsByEdge.get(`${from}>${to}`) ?? []))
    }

    cycles.push({
      id: ring.join('>'),
      stations: ring.map((node) => stations.get(node)).filter((station) => station !== undefined),
      legs: ringLegs,
      emptyReturn: false,
    })
  }

  const byId = new Map(missions.map((mission) => [mission.missionId, mission]))
  const haulAdjacency = new Map<string, Set<string>>()
  const haulLegsByEdge = new Map<string, CycleLeg[]>()
  const starts = new Set<string>()

  for (const leg of legs) {
    const mission = byId.get(leg.missionId)
    const left = mission === undefined ? null : goodsLeft(mission)
    if (left === null || left.toHaul === 0) {
      continue
    }

    const from = cycleStationKey(leg.from)
    const to = cycleStationKey(leg.to)
    const targets = haulAdjacency.get(from) ?? new Set<string>()
    targets.add(to)
    haulAdjacency.set(from, targets)

    const edge = `${from}>${to}`
    haulLegsByEdge.set(edge, [...(haulLegsByEdge.get(edge) ?? []), leg])

    if (left.atDepot > 0) {
      starts.add(from)
    }
  }

  const chains = openChains(haulAdjacency, starts, taken).sort(
    (left, right) => right.length - left.length || left.join('>').localeCompare(right.join('>')),
  )

  for (const chain of chains) {
    if (chain.some((node) => taken.has(node))) {
      continue
    }
    for (const node of chain) {
      taken.add(node)
    }

    const chainLegs: CycleLeg[] = []
    for (let index = 0; index < chain.length - 1; index += 1) {
      chainLegs.push(...(haulLegsByEdge.get(`${chain[index]}>${chain[index + 1]}`) ?? []))
    }

    cycles.push({
      id: chain.join('>'),
      stations: chain.map((node) => stations.get(node)).filter((station) => station !== undefined),
      legs: chainLegs,
      emptyReturn: true,
    })
  }

  return cycles
}

export function cycleByMissionId(cycles: readonly MissionCycle[]): Map<string, MissionCycle> {
  const byMission = new Map<string, MissionCycle>()

  for (const cycle of cycles) {
    for (const leg of cycle.legs) {
      byMission.set(leg.missionId, cycle)
    }
  }

  return byMission
}
