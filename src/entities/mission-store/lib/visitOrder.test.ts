import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MissionSystemGroup } from '@/entities/mission-store/lib/groupMissions'
import { createTranslate } from '@/shared/lib/i18n'
import { formatVisitOrder, visitOrder } from '@/entities/mission-store/lib/visitOrder'
import type { StoredMission } from '@/entities/mission-store/model/types'

const ru = createTranslate('ru')

function missions(count: number, completed = 0): StoredMission[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `m${index}`,
    targetSystem: 'HIP 8060',
    targetStation: 'x',
    addedAt: '2026-09-03T10:00:00.000Z',
    completed: index < completed,
  }))
}

function system(
  stations: { name: string; id?: string; count: number; completed?: number }[],
): MissionSystemGroup {
  return {
    key: 'HIP 8060',
    systemName: 'HIP 8060',
    missionCount: 0,
    completedCount: 0,
    stationCount: stations.length,
    bodyCount: 1,
    awaitingCount: 0,
    maxMissionsAtOneStation: 0,
    jumps: null,
    bodies: [
      {
        key: 'b',
        bodyName: null,
        missionCount: 0,
        stations: stations.map((station) => ({
          key: station.name,
          stationName: station.name,
          stationId: station.id,
          awaitingCount: 0,
          missions: missions(station.count, station.completed),
          completedCount: station.completed ?? 0,
        })),
      },
    ],
  }
}

test('больше миссий — раньше (пример из спецификации)', () => {
  const stops = visitOrder(
    system([
      { name: 'Fernandes Base', count: 1 },
      { name: 'Sealey Lab', count: 4 },
    ]),
    new Map(),
  )

  assert.equal(
    formatVisitOrder(stops, ru),
    'Сначала Sealey Lab — 4 миссии, затем Fernandes Base — 1.',
  )
})

test('при равном числе миссий ближе — раньше', () => {
  const stops = visitOrder(
    system([
      { name: 'Far', id: 'far', count: 2 },
      { name: 'Near', id: 'near', count: 2 },
    ]),
    new Map([
      ['far', { distanceToArrivalLs: 5000 }],
      ['near', { distanceToArrivalLs: 300 }],
    ]),
  )

  assert.deepEqual(
    stops.map((stop) => stop.stationName),
    ['Near', 'Far'],
  )
})

test('неизвестное расстояние идёт после известного, а не считается дальним', () => {
  const stops = visitOrder(
    system([
      { name: 'Unknown', count: 2 },
      { name: 'Known', id: 'k', count: 2 },
    ]),
    new Map([['k', { distanceToArrivalLs: 9000 }]]),
  )

  assert.deepEqual(
    stops.map((stop) => stop.stationName),
    ['Known', 'Unknown'],
  )
})

test('сданные миссии не считаются: станция со всеми сданными выпадает', () => {
  const stops = visitOrder(
    system([
      { name: 'Done', count: 3, completed: 3 },
      { name: 'Half', count: 3, completed: 2 },
      { name: 'Full', count: 2 },
    ]),
    new Map(),
  )

  assert.deepEqual(
    stops.map((stop) => [stop.stationName, stop.missions]),
    [
      ['Full', 2],
      ['Half', 1],
    ],
  )
})

test('ближняя станция раньше дальней, даже если миссий на ней меньше (68.2)', () => {
  const stops = visitOrder(
    system([
      { name: 'Far', id: 'far', count: 5 },
      { name: 'Near', id: 'near', count: 1 },
    ]),
    new Map([
      ['far', { distanceToArrivalLs: 187_532 }],
      ['near', { distanceToArrivalLs: 6 }],
    ]),
  )

  assert.deepEqual(
    stops.map((stop) => stop.stationName),
    ['Near', 'Far'],
  )
})

test('станция с неизвестным расстоянием идёт после известных, а не считается дальней', () => {
  const stops = visitOrder(
    system([
      { name: 'Unknown', count: 4 },
      { name: 'Known', id: 'known', count: 1 },
    ]),
    new Map([['known', { distanceToArrivalLs: 900 }]]),
  )

  assert.deepEqual(
    stops.map((stop) => stop.stationName),
    ['Known', 'Unknown'],
  )
})

test('одна станция — подсказки нет: обходить нечего', () => {
  assert.equal(
    formatVisitOrder(visitOrder(system([{ name: 'Only', count: 4 }]), new Map()), ru),
    null,
  )
})

test('три станции читаются одной фразой', () => {
  const stops = visitOrder(
    system([
      { name: 'A', count: 3 },
      { name: 'B', count: 2 },
      { name: 'C', count: 1 },
    ]),
    new Map(),
  )

  assert.equal(formatVisitOrder(stops, ru), 'Сначала A — 3 миссии, затем B — 2, потом C — 1.')
})

test('склонение слова «миссия»', () => {
  assert.equal(ru.plural('plural.missions', 1), '1 миссия')
  assert.equal(ru.plural('plural.missions', 2), '2 миссии')
  assert.equal(ru.plural('plural.missions', 5), '5 миссий')
  assert.equal(ru.plural('plural.missions', 11), '11 миссий')
  assert.equal(ru.plural('plural.missions', 21), '21 миссия')
})
