import type { Coords3D } from '@/entities/galaxy-data'

export type Candidate = {
  systemKey: string
  systemName: string
  coords: Coords3D
  stopSeconds: number
  missions: number
  cargoT: number
}

function comparePriority(left: Candidate, right: Candidate): number {
  if (left.cargoT !== right.cargoT) {
    return right.cargoT - left.cargoT
  }
  if (left.missions !== right.missions) {
    return right.missions - left.missions
  }
  return left.systemName.localeCompare(right.systemName)
}

export function nearestFirst(
  candidates: readonly Candidate[],
  from: Coords3D,
  hop: (a: Coords3D, b: Coords3D) => number,
): Candidate[] {
  const left = [...candidates]
  const order: Candidate[] = []
  let at = from

  while (left.length > 0) {
    let best = 0
    let bestJumps = hop(at, left[0]!.coords)

    for (let i = 1; i < left.length; i += 1) {
      const jumps = hop(at, left[i]!.coords)
      const better =
        jumps < bestJumps || (jumps === bestJumps && comparePriority(left[i]!, left[best]!) < 0)

      if (better) {
        best = i
        bestJumps = jumps
      }
    }

    const [chosen] = left.splice(best, 1)
    order.push(chosen!)
    at = chosen!.coords
  }

  return order
}

export function improve(
  order: readonly Candidate[],
  from: Coords3D,
  hop: (a: Coords3D, b: Coords3D) => number,
): Candidate[] {
  if (order.length < 3) {
    return [...order]
  }

  const travel = (route: readonly Candidate[]): number => {
    let total = 0
    let at = from
    for (const stop of route) {
      total += hop(at, stop.coords)
      at = stop.coords
    }
    return total + hop(at, from)
  }

  const earlierDelivers = (
    candidate: readonly Candidate[],
    current: readonly Candidate[],
  ): boolean => {
    for (let i = 0; i < candidate.length; i += 1) {
      const priority = comparePriority(candidate[i]!, current[i]!)
      if (priority !== 0) {
        return priority < 0
      }
    }
    return false
  }

  let best = [...order]
  let bestCost = travel(best)
  let improved = true
  let passes = 0

  const take = (candidate: Candidate[]): boolean => {
    const cost = travel(candidate)
    if (cost < bestCost || (cost === bestCost && earlierDelivers(candidate, best))) {
      best = candidate
      bestCost = cost
      return true
    }
    return false
  }

  while (improved && passes < 10) {
    improved = false
    passes += 1

    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ]
        if (take(candidate)) {
          improved = true
        }
      }
    }

    for (let taken = 0; taken < best.length; taken += 1) {
      const rest = [...best.slice(0, taken), ...best.slice(taken + 1)]
      const moved = best[taken]!

      for (let put = 0; put <= rest.length; put += 1) {
        if (put === taken) {
          continue
        }
        if (take([...rest.slice(0, put), moved, ...rest.slice(put)])) {
          improved = true
        }
      }
    }
  }

  return best
}
