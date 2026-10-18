import { useEffect, useMemo, useState } from 'react'
import { getStations, type ArrivalStar, type RegionCliKey } from '@/entities/galaxy-data'
import type { StoredMission } from '@/entities/mission-store/model/types'

export type MissionStationFacts = {
  distanceToArrivalLs?: number
  maxPadSize?: 'S' | 'M' | 'L'
  controllingFactionName?: string
  star?: ArrivalStar
  type?: string
}

export type StationFactsByStationId = ReadonlyMap<string, MissionStationFacts>

export function useMissionStationFacts(
  regionKey: RegionCliKey,
  missions: readonly StoredMission[],
  revision = 0,
): StationFactsByStationId {
  const systems = useMemo(() => {
    const byId = new Map<string, string>()
    for (const mission of missions) {
      if (mission.targetSystemId !== undefined) {
        byId.set(mission.targetSystemId, mission.targetSystem)
      }
    }
    return [...byId]
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([id, name]) => ({ id, name }))
  }, [missions])

  const [facts, setFacts] = useState<StationFactsByStationId>(new Map())

  const systemsKey = JSON.stringify({ revision, systems })

  useEffect(() => {
    const { systems: wanted } = JSON.parse(systemsKey) as {
      systems: { id: string; name: string }[]
    }
    if (wanted.length === 0) {
      return
    }

    let cancelled = false
    void Promise.all(wanted.map((system) => getStations(regionKey, system))).then((loaded) => {
      if (cancelled) {
        return
      }

      const next = new Map<string, MissionStationFacts>()
      for (const station of loaded.flat()) {
        next.set(station.id, {
          distanceToArrivalLs: station.distanceToArrivalLs,
          maxPadSize: station.maxPadSize,
          controllingFactionName: station.controllingFaction?.name,
          star: station.star,
          type: station.type,
        })
      }
      setFacts(next)
    })

    return () => {
      cancelled = true
    }
  }, [regionKey, systemsKey])

  return facts
}

export function stationDistancesFrom(facts: StationFactsByStationId): Map<string, number> {
  const distances = new Map<string, number>()

  for (const [stationId, station] of facts) {
    if (station.distanceToArrivalLs !== undefined) {
      distances.set(stationId, station.distanceToArrivalLs)
    }
  }

  return distances
}
