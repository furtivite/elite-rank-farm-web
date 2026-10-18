import assert from 'node:assert/strict'
import { estimateJumps } from '@/entities/galaxy-data'
import type { StoredMission } from '@/entities/mission-store/model/types'

let counter = 0

export function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: 'HIP 8060',
    targetStation: 'Fernandes Base',
    addedAt: `2026-09-02T10:00:0${counter % 10}.000Z`,
    ...overrides,
  }
}

export function jumpsAt(distance: number) {
  const estimate = estimateJumps({ x: 0, y: 0, z: 0 }, { x: distance, y: 0, z: 0 }, 10)
  assert.ok(estimate)
  return estimate
}
