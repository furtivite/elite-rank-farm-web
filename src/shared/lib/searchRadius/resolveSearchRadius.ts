export type SearchRadius = {
  radiusLy: number
  clamped: boolean
  requestedLy: number
}

export const MAX_SEARCH_RADIUS_LY = 150

export function starLayerRadiusLy(jumpRangeLy: number, multiplier: number): number {
  const range = Math.max(jumpRangeLy, 0)
  return Math.min(range * Math.max(multiplier, 1), MAX_SEARCH_RADIUS_LY) + range
}

export function resolveSearchRadius(
  jumpRangeLy: number,
  multiplier: number,
  regionRadiusLy: number | null,
): SearchRadius {
  const requestedLy = jumpRangeLy * multiplier

  const dataLimit =
    regionRadiusLy === null || !Number.isFinite(regionRadiusLy) ? Infinity : regionRadiusLy
  const limit = Math.min(dataLimit, MAX_SEARCH_RADIUS_LY)

  if (requestedLy <= limit) {
    return { radiusLy: requestedLy, clamped: false, requestedLy }
  }

  return { radiusLy: limit, clamped: true, requestedLy }
}

export function isMultiplierAvailable(
  jumpRangeLy: number | null,
  multiplier: number,
  regionRadiusLy: number | null,
): boolean {
  if (jumpRangeLy === null || jumpRangeLy <= 0 || regionRadiusLy === null) {
    return true
  }

  return jumpRangeLy * multiplier <= Math.min(regionRadiusLy, MAX_SEARCH_RADIUS_LY)
}

export function reliableJumps(multiplier: number): number {
  return Math.max(1, multiplier - 1)
}
