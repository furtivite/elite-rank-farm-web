import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { groupMissions } from '@/entities/mission-store'
import type { StationFactsByStationId, StoredMission } from '@/entities/mission-store'
import { SystemCloseTime } from '@/widgets/mission-basket/ui/SystemCloseTime'
import { DOCKING_SECONDS, JUMP_SECONDS, supercruiseSeconds } from '@/shared/lib/travelTime'

const minutes = (distanceLs: number): number =>
  Math.round((JUMP_SECONDS + supercruiseSeconds(distanceLs)! + DOCKING_SECONDS) / 60)

let counter = 0

function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: 'Ngalinn',
    targetStation: 'Hickam Survey',
    targetStationId: 'a',
    addedAt: '2026-09-15T10:00:00.000Z',
    ...overrides,
  }
}

function render(missions: StoredMission[], facts: StationFactsByStationId): string {
  const [system] = groupMissions(missions)
  assert.ok(system)

  return renderToStaticMarkup(React.createElement(SystemCloseTime, { system, stationFacts: facts }))
}

test('показывает время коротко, а полную фразу — голосом (20)', () => {
  const html = render([mission()], new Map([['a', { distanceToArrivalLs: 300 }]]))
  const expected = minutes(300)

  assert.match(html, new RegExp(`~${expected} min`))
  assert.match(html, new RegExp(`1 mission, 1 station, ~${expected} min`))
})

test('что это время только туда — видно и слышно, а не только при наведении', () => {
  const html = render([mission()], new Map([['a', { distanceToArrivalLs: 300 }]]))

  assert.match(html, /aria-hidden="true">~\d+ min there</)
  assert.match(html, /sr-only">[^<]*a lower bound: the way there/)
})

test('молчит, когда расстояние неизвестно ни до одной станции', () => {
  assert.equal(render([mission()], new Map()), '')
})

test('станции без расстояния не мешают посчитать остальные', () => {
  const html = render(
    [mission({ targetStationId: 'a' }), mission({ targetStation: 'Вторая', targetStationId: 'b' })],
    new Map([['a', { distanceToArrivalLs: 300 }]]),
  )

  assert.match(html, new RegExp(`~${minutes(300)} min`))
})
