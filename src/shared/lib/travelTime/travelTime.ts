export const JUMP_SECONDS = 51

export const DOCKING_SECONDS = 70

const SUPERCRUISE_STEPS: ReadonlyArray<{ upToLs: number; seconds: number }> = [
  { upToLs: 100, seconds: 100 },
  { upToLs: 500, seconds: 140 },
  { upToLs: 1500, seconds: 190 },
  { upToLs: 5000, seconds: 240 },
  { upToLs: 20000, seconds: 285 },
  { upToLs: 50000, seconds: 355 },
]

const BEYOND_LAST_STEP_SECONDS = 650

export function supercruiseSeconds(distanceToArrivalLs: number | undefined): number | null {
  if (distanceToArrivalLs === undefined || !Number.isFinite(distanceToArrivalLs)) {
    return null
  }

  const distance = Math.max(0, distanceToArrivalLs)

  for (const step of SUPERCRUISE_STEPS) {
    if (distance <= step.upToLs) {
      return step.seconds
    }
  }

  return BEYOND_LAST_STEP_SECONDS
}

export function travelSeconds({
  jumps,
  distanceToArrivalLs,
}: {
  jumps: number | null
  distanceToArrivalLs: number | undefined
}): number | null {
  const supercruise = supercruiseSeconds(distanceToArrivalLs)

  if (jumps === null || supercruise === null) {
    return null
  }

  return jumps * JUMP_SECONDS + supercruise + DOCKING_SECONDS
}
