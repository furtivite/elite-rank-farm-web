import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DOCKING_SECONDS,
  JUMP_SECONDS,
  supercruiseSeconds,
  travelSeconds,
} from '@/shared/lib/travelTime'

test('ступени суперкруиза — измеренные, 2026-09-19 (20.2)', () => {
  assert.equal(supercruiseSeconds(0), 100)
  assert.equal(supercruiseSeconds(100), 100)
  assert.equal(supercruiseSeconds(101), 140)
  assert.equal(supercruiseSeconds(500), 140)
  assert.equal(supercruiseSeconds(1500), 190)
  assert.equal(supercruiseSeconds(5000), 240)
  assert.equal(supercruiseSeconds(20000), 285)
  assert.equal(supercruiseSeconds(50000), 355)
})

test('дальше последней ступени — своё значение, а не потолок', () => {
  assert.equal(supercruiseSeconds(187532), 650)
})

test('неизвестное расстояние не подменяется числом (12)', () => {
  assert.equal(supercruiseSeconds(undefined), null)
  assert.equal(supercruiseSeconds(Number.NaN), null)
})

test('дорога целиком: прыжки, суперкруиз и стыковка', () => {
  assert.equal(
    travelSeconds({ jumps: 3, distanceToArrivalLs: 300 }),
    3 * JUMP_SECONDS + supercruiseSeconds(300)! + DOCKING_SECONDS,
  )
  assert.equal(
    travelSeconds({ jumps: 0, distanceToArrivalLs: 42 }),
    supercruiseSeconds(42)! + DOCKING_SECONDS,
  )
})

test('не хватает любой половины — считать нечем', () => {
  assert.equal(travelSeconds({ jumps: null, distanceToArrivalLs: 300 }), null)
  assert.equal(travelSeconds({ jumps: 2, distanceToArrivalLs: undefined }), null)
})

test('шкала монотонна: дальше не может стать быстрее', () => {
  const distances = [
    0, 50, 100, 499, 500, 1499, 1500, 4999, 5000, 19999, 20000, 49999, 50000, 100000,
  ]
  let previous = 0

  for (const distance of distances) {
    const seconds = supercruiseSeconds(distance)
    assert.ok(seconds !== null)
    assert.ok(seconds >= previous, `${distance} ls стало быстрее, чем ближняя ступень`)
    previous = seconds
  }
})
