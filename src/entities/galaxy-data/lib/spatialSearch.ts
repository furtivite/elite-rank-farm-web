import type { SystemIndexEntry } from '@/entities/galaxy-data/model/types'

export type Coords3D = { x: number; y: number; z: number }

export function distanceLy(a: Coords3D, b: Coords3D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function withinBoundingBox(point: Coords3D, center: Coords3D, radiusLy: number): boolean {
  return (
    Math.abs(point.x - center.x) <= radiusLy &&
    Math.abs(point.y - center.y) <= radiusLy &&
    Math.abs(point.z - center.z) <= radiusLy
  )
}

export type ReachableSystem = SystemIndexEntry & { distanceLy: number }

export function findSystemsWithinRadius(
  systems: readonly SystemIndexEntry[],
  center: Coords3D,
  radiusLy: number,
): ReachableSystem[] {
  const result: ReachableSystem[] = []

  for (const system of systems) {
    if (!withinBoundingBox(system, center, radiusLy)) {
      continue
    }

    const distance = distanceLy(system, center)
    if (distance <= radiusLy) {
      result.push({ ...system, distanceLy: distance })
    }
  }

  return result.sort((a, b) => a.distanceLy - b.distanceLy)
}
