'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSystemCoordsByIds, type Coords3D, type RegionCliKey } from '@/entities/galaxy-data'
import type { StoredMission } from '@/entities/mission-store/model/types'

export function useMissionSystemCoords(
  regionKey: RegionCliKey,
  missions: readonly StoredMission[],
): ReadonlyMap<string, Coords3D> {
  const targets = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>()
    for (const mission of missions) {
      if (mission.targetSystemId !== undefined) {
        byId.set(mission.targetSystemId, {
          id: mission.targetSystemId,
          name: mission.targetSystem,
        })
      }
    }
    return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id))
  }, [missions])

  const [coords, setCoords] = useState<ReadonlyMap<string, Coords3D>>(new Map())
  const key = useMemo(() => targets.map((target) => target.id).join(','), [targets])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTargets = useMemo(() => targets, [key])

  useEffect(() => {
    if (stableTargets.length === 0) {
      return
    }

    let cancelled = false

    void getSystemCoordsByIds(regionKey, stableTargets).then((loaded) => {
      if (!cancelled) {
        setCoords(loaded)
      }
    })

    return () => {
      cancelled = true
    }
  }, [regionKey, stableTargets])

  return stableTargets.length === 0 ? EMPTY : coords
}

const EMPTY: ReadonlyMap<string, Coords3D> = new Map()
