import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  closeTimeMinutes,
  estimateCloseTime,
  estimateSystemCloseTime,
} from '@/entities/mission-store/lib/estimateCloseTime'
import { groupMissions } from '@/entities/mission-store/lib/groupMissions'
import { DOCKING_SECONDS, JUMP_SECONDS, supercruiseSeconds } from '@/shared/lib/travelTime'
import { estimateJumps } from '@/entities/galaxy-data'
import type { StoredMission } from '@/entities/mission-store'

let counter = 0

function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: 'Ngalinn',
    targetStation: 'Hickam Survey',
    addedAt: '2026-09-15T10:00:00.000Z',
    ...overrides,
  }
}

test('складывает прыжки, суперкруиз и стыковку (20, 20.1)', () => {
  const near = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 90, y: 0, z: 0 }, 30)
  assert.ok(near)
  assert.equal(near.minJumps, 3)

  const groups = groupMissions(
    [
      mission({ targetSystemId: 's1', targetStation: 'Ближняя', targetStationId: 'a' }),
      mission({ targetSystemId: 's1', targetStation: 'Дальняя', targetStationId: 'b' }),
    ],
    { jumps: new Map([['s1', near]]) },
  )

  const estimate = estimateSystemCloseTime(
    groups[0]!,
    new Map([
      ['a', { distanceToArrivalLs: 300 }],
      ['b', { distanceToArrivalLs: 1200 }],
    ]),
  )

  assert.equal(
    estimate.seconds,
    3 * JUMP_SECONDS +
      supercruiseSeconds(300)! +
      DOCKING_SECONDS +
      supercruiseSeconds(1200)! +
      DOCKING_SECONDS,
  )
  assert.equal(closeTimeMinutes(estimate), Math.round(estimate.seconds / 60))
  assert.equal(estimate.stations, 2)
  assert.equal(estimate.missions, 2)
})

test('станция без расстояния не считается, но названа числом (12)', () => {
  const groups = groupMissions([
    mission({ targetSystemId: 's1', targetStation: 'Без данных', targetStationId: 'a' }),
  ])

  const estimate = estimateSystemCloseTime(groups[0]!, new Map())

  assert.equal(estimate.unknownStations, 1)
  assert.equal(estimate.seconds, JUMP_SECONDS)
})

test('неизвестные прыжки считаются одним, как и в режиме разгрузки (19.1)', () => {
  const groups = groupMissions([mission({ targetSystemId: 's1', targetStationId: 'a' })])

  const estimate = estimateSystemCloseTime(
    groups[0]!,
    new Map([['a', { distanceToArrivalLs: 50 }]]),
  )

  assert.equal(estimate.seconds, JUMP_SECONDS + supercruiseSeconds(50)! + DOCKING_SECONDS)
})

test('по всей корзине — сумма систем', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Одна', targetSystemId: 's1', targetStationId: 'a' }),
    mission({ targetSystem: 'Две', targetSystemId: 's2', targetStationId: 'b' }),
  ])

  const facts = new Map([
    ['a', { distanceToArrivalLs: 50 }],
    ['b', { distanceToArrivalLs: 50 }],
  ])

  const total = estimateCloseTime(groups, facts)

  assert.equal(total.seconds, 2 * (JUMP_SECONDS + supercruiseSeconds(50)! + DOCKING_SECONDS))
  assert.equal(total.stations, 2)
  assert.equal(total.missions, 2)
})

test('минуты округляются, но не до нуля', () => {
  assert.equal(closeTimeMinutes({ seconds: 10, unknownStations: 0, stations: 1, missions: 1 }), 1)
  assert.equal(closeTimeMinutes({ seconds: 449, unknownStations: 0, stations: 1, missions: 1 }), 7)
})
