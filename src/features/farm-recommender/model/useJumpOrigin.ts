import { useEffect, useState } from 'react'
import { estimateJumpRange } from '@/entities/commander-state'
import { resolveSystemCoords, type Coords3D } from '@/entities/galaxy-data'
import type { CommanderState } from '@/entities/commander-state'
import type { JumpOrigin } from '@/entities/mission-store'
import { FARM_MODE_TO_REGION, type FarmSearchParams } from '@/features/farm-recommender/model/types'

export function useJumpOrigin(
  commanderState: CommanderState | null,
  lastParams: FarmSearchParams | null,
): JumpOrigin | null {
  const [manualCoords, setManualCoords] = useState<Coords3D | null>(null)

  const manualOrigin = commanderState === null ? (lastParams?.currentSystem ?? null) : null
  const manualName = manualOrigin?.kind === 'name' ? manualOrigin.name : null
  const manualRegion = lastParams === null ? null : FARM_MODE_TO_REGION[lastParams.mode]

  useEffect(() => {
    if (manualName === null || manualRegion === null) {
      return
    }

    let cancelled = false
    void resolveSystemCoords(manualRegion, manualName).then((coords) => {
      if (!cancelled) {
        setManualCoords(coords)
      }
    })

    return () => {
      cancelled = true
    }
  }, [manualName, manualRegion])

  const actualRange = estimateJumpRange(commanderState?.loadout ?? null)
  const jumpRangeLy =
    actualRange?.currentLy ?? commanderState?.jumpRangeLy ?? lastParams?.jumpRangeLy ?? 0
  if (jumpRangeLy <= 0) {
    return null
  }

  if (commanderState !== null) {
    return { coords: commanderState.currentSystem, jumpRangeLy }
  }

  if (manualOrigin === null) {
    return null
  }

  const coords = manualOrigin.kind === 'coords' ? manualOrigin : manualCoords
  return coords === null ? null : { coords, jumpRangeLy }
}
