import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  estimateJumps,
  getStarLayerNear,
  getSystemCoordsByIds,
  jumpsFromOrigin,
  withGraphJumps,
  type Coords3D,
  type JumpEstimate,
  type RegionCliKey,
} from '@/entities/galaxy-data'
import { getDistanceModeSnapshot, subscribeToDistanceMode } from '@/shared/lib/distanceMode'
import type { JumpsBySystemId } from '@/entities/mission-store/lib/groupMissions'
import type { StoredMission } from '@/entities/mission-store/model/types'
import {
  getJumpMultiplierSnapshot,
  getServerJumpMultiplierSnapshot,
  starLayerRadiusLy,
  subscribeToJumpMultiplier,
} from '@/shared/lib/searchRadius'

export type JumpOrigin = {
  coords: Coords3D
  jumpRangeLy: number
}

export function useMissionJumps(
  regionKey: RegionCliKey,
  missions: readonly StoredMission[],
  origin: JumpOrigin | null,
): JumpsBySystemId {
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

  const systemIds = useMemo(() => targets.map((target) => target.id), [targets])

  const [coords, setCoords] = useState<ReadonlyMap<string, Coords3D>>(new Map())

  const distanceMode = useSyncExternalStore(
    subscribeToDistanceMode,
    getDistanceModeSnapshot,
    () => 'straight' as const,
  )

  const jumpMultiplier = useSyncExternalStore(
    subscribeToJumpMultiplier,
    getJumpMultiplierSnapshot,
    getServerJumpMultiplierSnapshot,
  )

  const [graphJumps, setGraphJumps] = useState<ReadonlyMap<string, number>>(new Map())
  const originKey =
    origin === null
      ? null
      : `${origin.coords.x},${origin.coords.y},${origin.coords.z},${origin.jumpRangeLy}`

  useEffect(() => {
    if (distanceMode !== 'jumps' || origin === null) {
      setGraphJumps(new Map())
      return
    }

    let cancelled = false
    void getStarLayerNear(
      regionKey,
      origin.coords,
      starLayerRadiusLy(origin.jumpRangeLy, jumpMultiplier),
    )
      .then((layer) => {
        if (!cancelled) {
          setGraphJumps(jumpsFromOrigin(layer, origin.coords, origin.jumpRangeLy))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGraphJumps(new Map())
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey, distanceMode, originKey, jumpMultiplier])

  const systemIdsKey = systemIds.join(',')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTargets = useMemo(() => targets, [systemIdsKey])

  useEffect(() => {
    if (systemIdsKey === '') {
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
  }, [regionKey, systemIdsKey, stableTargets])

  return useMemo(() => {
    const jumps = new Map<string, JumpEstimate>()
    if (origin === null) {
      return jumps
    }

    for (const systemId of systemIds) {
      const estimate = estimateJumps(
        origin.coords,
        coords.get(systemId) ?? null,
        origin.jumpRangeLy,
      )
      if (estimate === null) {
        continue
      }

      const byGraph = graphJumps.get(systemId)
      jumps.set(systemId, byGraph === undefined ? estimate : withGraphJumps(estimate, byGraph))
    }

    return jumps
  }, [coords, graphJumps, origin, systemIds])
}
