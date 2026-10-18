import { distanceLy, type Coords3D } from '@/entities/galaxy-data/lib/spatialSearch'

export const MULTI_JUMP_FROM = 2

export type JumpEstimate = {
  distanceLy: number
  minJumps: number
  isFar: boolean
  source: 'straight' | 'graph'
}

export function estimateJumps(
  from: Coords3D | null,
  to: Coords3D | null,
  jumpRangeLy: number | null,
): JumpEstimate | null {
  if (from === null || to === null || jumpRangeLy === null || jumpRangeLy <= 0) {
    return null
  }

  const distance = distanceLy(from, to)
  const minJumps = Math.ceil(distance / jumpRangeLy)

  return {
    distanceLy: distance,
    minJumps,
    isFar: minJumps >= MULTI_JUMP_FROM,
    source: 'straight',
  }
}

export function withGraphJumps(estimate: JumpEstimate, jumps: number): JumpEstimate {
  return {
    ...estimate,
    minJumps: jumps,
    isFar: jumps >= MULTI_JUMP_FROM,
    source: 'graph',
  }
}

export function jumpPenalty(estimate: JumpEstimate | null): number {
  if (estimate === null) {
    return 0
  }

  return Math.max(0, estimate.minJumps - (MULTI_JUMP_FROM - 1))
}
