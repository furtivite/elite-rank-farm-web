import type { Coords3D } from '@/entities/galaxy-data/lib/spatialSearch'

export type StarLayerEntry = readonly [id: string, x: number, y: number, z: number]

export type StarLayer = {
  regionId: string
  radiusLy: number
  count: number
  systems: readonly StarLayerEntry[]
}

export function jumpsFromOrigin(
  layer: StarLayer,
  origin: Coords3D,
  jumpRangeLy: number,
): ReadonlyMap<string, number> {
  const result = new Map<string, number>()
  if (jumpRangeLy <= 0 || layer.systems.length === 0) {
    return result
  }

  const stars = layer.systems
  const size = stars.length
  const x = new Float64Array(size)
  const y = new Float64Array(size)
  const z = new Float64Array(size)
  for (let i = 0; i < size; i += 1) {
    const star = stars[i]
    x[i] = star[1]
    y[i] = star[2]
    z[i] = star[3]
  }

  const limit = jumpRangeLy * jumpRangeLy
  const distance = new Int32Array(size).fill(-1)

  const grid = new Map<string, number[]>()
  const cellOf = (value: number): number => Math.floor(value / jumpRangeLy)
  const keyOf = (cx: number, cy: number, cz: number): string => `${cx},${cy},${cz}`

  const bucketOf: string[] = new Array<string>(size)
  const slotOf = new Int32Array(size)

  for (let i = 0; i < size; i += 1) {
    const key = keyOf(cellOf(x[i]), cellOf(y[i]), cellOf(z[i]))
    bucketOf[i] = key
    const bucket = grid.get(key)
    if (bucket === undefined) {
      grid.set(key, [i])
      slotOf[i] = 0
    } else {
      slotOf[i] = bucket.length
      bucket.push(i)
    }
  }

  const take = (index: number): void => {
    const bucket = grid.get(bucketOf[index])
    if (bucket === undefined) {
      return
    }
    const slot = slotOf[index]
    const last = bucket[bucket.length - 1]
    bucket[slot] = last
    slotOf[last] = slot
    bucket.pop()
  }

  const near = (px: number, py: number, pz: number): number[] => {
    const cx = cellOf(px)
    const cy = cellOf(py)
    const cz = cellOf(pz)
    const found: number[] = []
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dz = -1; dz <= 1; dz += 1) {
          const bucket = grid.get(keyOf(cx + dx, cy + dy, cz + dz))
          if (bucket !== undefined && bucket.length > 0) {
            found.push(...bucket)
          }
        }
      }
    }
    return found
  }

  let frontier: number[] = []
  for (const i of near(origin.x, origin.y, origin.z)) {
    const dx = origin.x - x[i]
    const dy = origin.y - y[i]
    const dz = origin.z - z[i]
    if (dx * dx + dy * dy + dz * dz <= limit) {
      distance[i] = 1
      take(i)
      frontier.push(i)
      result.set(stars[i][0], 1)
    }
  }

  for (const index of frontier) {
    const dx = origin.x - x[index]
    const dy = origin.y - y[index]
    const dz = origin.z - z[index]
    if (dx * dx + dy * dy + dz * dz < 1e-6) {
      distance[index] = 0
      result.set(stars[index][0], 0)
    }
  }

  while (frontier.length > 0) {
    const next: number[] = []
    for (const u of frontier) {
      const xu = x[u]
      const yu = y[u]
      const zu = z[u]
      const du = distance[u]
      for (const v of near(xu, yu, zu)) {
        const dx = xu - x[v]
        const dy = yu - y[v]
        const dz = zu - z[v]
        if (dx * dx + dy * dy + dz * dz <= limit) {
          distance[v] = du + 1
          take(v)
          result.set(stars[v][0], du + 1)
          next.push(v)
        }
      }
    }
    frontier = next
  }

  return result
}
