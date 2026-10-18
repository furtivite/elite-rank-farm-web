import type { Coords3D } from '@/entities/galaxy-data/lib/spatialSearch'

export type CellAddress = readonly [number, number, number]

export function cellOf(point: Coords3D, cellLy: number): CellAddress {
  return [Math.floor(point.x / cellLy), Math.floor(point.y / cellLy), Math.floor(point.z / cellLy)]
}

export function cellsAround(center: Coords3D, radiusLy: number, cellLy: number): CellAddress[] {
  const low = cellOf(
    { x: center.x - radiusLy, y: center.y - radiusLy, z: center.z - radiusLy },
    cellLy,
  )
  const high = cellOf(
    { x: center.x + radiusLy, y: center.y + radiusLy, z: center.z + radiusLy },
    cellLy,
  )

  const cells: CellAddress[] = []
  for (let x = low[0]; x <= high[0]; x += 1) {
    for (let y = low[1]; y <= high[1]; y += 1) {
      for (let z = low[2]; z <= high[2]; z += 1) {
        if (touchesSphere([x, y, z], center, radiusLy, cellLy)) {
          cells.push([x, y, z])
        }
      }
    }
  }

  return cells
}

function touchesSphere(
  cell: CellAddress,
  center: Coords3D,
  radiusLy: number,
  cellLy: number,
): boolean {
  const axes: Array<[number, number]> = [
    [cell[0], center.x],
    [cell[1], center.y],
    [cell[2], center.z],
  ]

  let squared = 0
  for (const [index, value] of axes) {
    const low = index * cellLy
    const high = low + cellLy
    const nearest = value < low ? low : value > high ? high : value
    const delta = value - nearest
    squared += delta * delta
  }

  return squared <= radiusLy * radiusLy
}

export const NAME_BUCKETS = 256

export function nameBucket(name: string, buckets: number = NAME_BUCKETS): string {
  const bytes = new TextEncoder().encode(name)
  let hash = 0x811c9dc5

  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return (hash % buckets).toString(16).padStart(2, '0')
}
