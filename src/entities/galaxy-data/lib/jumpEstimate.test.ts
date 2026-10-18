import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  estimateJumps,
  jumpPenalty,
  MULTI_JUMP_FROM,
} from '@/entities/galaxy-data/lib/jumpEstimate'

const origin = { x: 0, y: 0, z: 0 }

test('считает нижнюю границу прыжков по прямой (50.2)', () => {
  const estimate = estimateJumps(origin, { x: 30, y: 0, z: 0 }, 20)

  assert.ok(estimate)
  assert.equal(estimate.distanceLy, 30)
  assert.equal(estimate.minJumps, 2)
  assert.equal(estimate.isFar, true)
})

test('цель в пределах одного прыжка дальней не считается', () => {
  const estimate = estimateJumps(origin, { x: 12, y: 0, z: 0 }, 20)

  assert.ok(estimate)
  assert.equal(estimate.minJumps, 1)
  assert.equal(estimate.isFar, false)
  assert.equal(jumpPenalty(estimate), 0)
})

test('без координат или дальности прыжка ответа нет, а не ноль (50.3)', () => {
  assert.equal(estimateJumps(origin, null, 20), null)
  assert.equal(estimateJumps(null, { x: 12, y: 0, z: 0 }, 20), null)
  assert.equal(estimateJumps(origin, { x: 12, y: 0, z: 0 }, null), null)
  assert.equal(estimateJumps(origin, { x: 12, y: 0, z: 0 }, 0), null)
})

test('штраф нарастает с числом прыжков, неизвестность не штрафуется (50.4)', () => {
  const jumps = (distance: number) =>
    jumpPenalty(estimateJumps(origin, { x: distance, y: 0, z: 0 }, 10))

  assert.equal(jumps(5), 0)
  assert.equal(jumps(15), 1)
  assert.equal(jumps(25), 2)
  assert.equal(jumpPenalty(null), 0)
})

test('порог дальности держится одним значением (50.4)', () => {
  const atThreshold = estimateJumps(origin, { x: 10 * MULTI_JUMP_FROM, y: 0, z: 0 }, 10)
  const belowThreshold = estimateJumps(origin, { x: 10 * (MULTI_JUMP_FROM - 1), y: 0, z: 0 }, 10)

  assert.equal(atThreshold?.isFar, true)
  assert.equal(belowThreshold?.isFar, false)
})
