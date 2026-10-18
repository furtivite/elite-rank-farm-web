import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupMissions, type StoredMission } from '@/entities/mission-store'
import { DOCKING_SECONDS, JUMP_SECONDS, supercruiseSeconds } from '@/shared/lib/travelTime'
import { planRoute, type RouteContext } from '@/features/route-plan/lib/planRoute'
import type { Coords3D } from '@/entities/galaxy-data'

let counter = 0

function mission(system: string, id: string, station = 'База'): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: system,
    targetSystemId: id,
    targetStation: station,
    targetStationId: `${id}-station`,
    addedAt: '2026-09-15T10:00:00.000Z',
  }
}

const ORIGIN = { coords: { x: 0, y: 0, z: 0 } as Coords3D, jumpRangeLy: 10 }

const CONTEXT: RouteContext = {
  hasUncollectedDepot: true,
  hasReturnLeg: false,
  start: { systemName: 'Старт', stationName: 'Стоянка', distanceToArrivalLs: 50 },
}

const FACTS = new Map(
  ['a-station', 'b-station', 'c-station', 'd-station'].map((id) => [
    id,
    { distanceToArrivalLs: 50 },
  ]),
)

test('маршрут начинается от командира и идёт к ближайшей (18.3)', () => {
  const groups = groupMissions([mission('Далеко', 'b'), mission('Близко', 'a')])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 100, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)

  assert.ok(plan)
  assert.deepEqual(
    plan.stops.map((stop) => stop.systemName),
    ['Близко', 'Далеко'],
  )
})

test('кольцо A(10) B(60) C(−50) одинаково в обе стороны — довод 18.3 отпал', () => {
  const groups = groupMissions([mission('A', 'a'), mission('B', 'b'), mission('C', 'c')])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 60, y: 0, z: 0 }],
    ['c', { x: -50, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)
  assert.ok(plan)

  const ring = plan.stops.reduce((sum, stop) => sum + stop.jumps, 0) + plan.returnLeg.jumps
  assert.equal(ring, 22)
})

test('улучшение чинит кольцо там, где жадность ошибается (18.5)', () => {
  const groups = groupMissions([
    mission('A', 'a'),
    mission('B', 'b'),
    mission('C', 'c'),
    mission('D', 'd'),
  ])
  const coords = new Map<string, Coords3D>([
    ['a', { x: -30, y: 15, z: 0 }],
    ['b', { x: 9, y: -44, z: 0 }],
    ['c', { x: -13, y: 57, z: 0 }],
    ['d', { x: 17, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)
  assert.ok(plan)

  const ring = plan.stops.reduce((sum, stop) => sum + stop.jumps, 0) + plan.returnLeg.jumps
  assert.ok(ring < 28, `кольцо должно быть короче жадного: ${ring} против 28`)
})

test('система без координат в маршрут не идёт, но названа', () => {
  const groups = groupMissions([mission('Известная', 'a'), mission('Безымянная', 'нет-такой')])
  const coords = new Map<string, Coords3D>([['a', { x: 10, y: 0, z: 0 }]])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)

  assert.ok(plan)
  assert.deepEqual(plan.skipped, ['Безымянная'])
  assert.equal(plan.stops.length, 1)
})

test('система, где всё сдано, в маршрут не попадает', () => {
  const done: StoredMission = { ...mission('Сданная', 'a'), completed: true }
  const groups = groupMissions([done])

  assert.equal(
    planRoute(groups, new Map([['a', { x: 10, y: 0, z: 0 }]]), ORIGIN, FACTS, CONTEXT),
    null,
  )
})

test('без позиции командира маршрута нет', () => {
  const groups = groupMissions([mission('A', 'a')])

  assert.equal(
    planRoute(groups, new Map([['a', { x: 10, y: 0, z: 0 }]]), null, FACTS, CONTEXT),
    null,
  )
})

test('время маршрута складывается из перелётов и стоянок (20.1)', () => {
  const groups = groupMissions([mission('A', 'a')])
  const coords = new Map<string, Coords3D>([['a', { x: 10, y: 0, z: 0 }]])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)

  assert.ok(plan)
  const leg = JUMP_SECONDS + supercruiseSeconds(50)! + DOCKING_SECONDS
  assert.equal(plan.stops[0]?.seconds, leg)
  assert.equal(plan.stops[0]?.jumps, 1)
  assert.equal(plan.returnLeg.seconds, leg)
  assert.equal(plan.seconds, 2 * leg)
})

test('порядок устойчив: одинаковая корзина даёт одинаковый маршрут', () => {
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 10, y: 0, z: 0 }],
  ])
  const first = planRoute(
    groupMissions([mission('Б', 'b'), mission('А', 'a')]),
    coords,
    ORIGIN,
    FACTS,
    CONTEXT,
  )
  const second = planRoute(
    groupMissions([mission('А', 'a'), mission('Б', 'b')]),
    coords,
    ORIGIN,
    FACTS,
    CONTEXT,
  )

  assert.deepEqual(
    first?.stops.map((s) => s.systemName),
    second?.stops.map((s) => s.systemName),
  )
})

test('без причины возвращаться маршрута нет, хотя систем три (18.4)', () => {
  const groups = groupMissions([mission('A', 'a'), mission('B', 'b'), mission('C', 'c')])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 20, y: 0, z: 0 }],
    ['c', { x: 30, y: 0, z: 0 }],
  ])

  assert.equal(
    planRoute(groups, coords, ORIGIN, FACTS, {
      ...CONTEXT,
      hasUncollectedDepot: false,
      hasReturnLeg: false,
    }),
    null,
  )
})

test('пометки «возвратная» довольно, склад при этом добран (18.4)', () => {
  const groups = groupMissions([mission('A', 'a'), mission('B', 'b')])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 20, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, {
    ...CONTEXT,
    hasUncollectedDepot: false,
    hasReturnLeg: true,
  })

  assert.ok(plan)
  assert.equal(plan.stops.length, 2)
})

test('вне стыковки возврат идёт в систему и без стыковки (18.5)', () => {
  const groups = groupMissions([mission('A', 'a')])
  const coords = new Map<string, Coords3D>([['a', { x: 10, y: 0, z: 0 }]])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, {
    ...CONTEXT,
    start: { systemName: 'Старт', stationName: null },
  })

  assert.ok(plan)
  assert.equal(plan.returnLeg.stationName, null)
  assert.equal(plan.returnLeg.seconds, JUMP_SECONDS)
})

test('расстояние до стартовой станции неизвестно — суперкруиз не выдумывается (12)', () => {
  const groups = groupMissions([mission('A', 'a')])
  const coords = new Map<string, Coords3D>([['a', { x: 10, y: 0, z: 0 }]])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, {
    ...CONTEXT,
    start: { systemName: 'Старт', stationName: 'Стоянка' },
  })

  assert.ok(plan)
  assert.equal(plan.returnLeg.seconds, JUMP_SECONDS + DOCKING_SECONDS)
})

test('кольцо считается кольцом: улучшение видит возврат (18.5)', () => {
  const groups = groupMissions([mission('A', 'a'), mission('B', 'b'), mission('D', 'd')])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 20, y: 0, z: 0 }],
    ['d', { x: 110, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)

  assert.ok(plan)
  const outbound = plan.stops.reduce((sum, stop) => sum + stop.jumps, 0)
  assert.equal(plan.returnLeg.jumps, 11)
  assert.equal(plan.seconds > outbound * JUMP_SECONDS, true, 'возврат входит в итог')
})

test('при равных прыжках первой идёт система с большим грузом (18.6)', () => {
  const groups = groupMissions([
    mission('Мало груза', 'a'),
    mission('Много груза', 'b'),
    mission('Много груза', 'b'),
    mission('Много груза', 'b'),
  ])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 10, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, {
    ...CONTEXT,
    cargoTonsBySystem: new Map([
      ['мало груза', 1],
      ['много груза', 5],
    ]),
  })

  assert.ok(plan)
  assert.equal(plan.stops[0]?.systemName, 'Много груза')
  assert.equal(plan.stops[0]?.cargoT, 5)
})

test('груза нет ни у кого — первой идёт система с большим числом заданий (18.6)', () => {
  const groups = groupMissions([
    mission('Одно', 'a'),
    mission('Три', 'b'),
    mission('Три', 'b', 'Вторая'),
    mission('Три', 'b', 'Третья'),
  ])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 10, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, CONTEXT)

  assert.ok(plan)
  assert.equal(plan.stops[0]?.systemName, 'Три')
})

test('пять тонн с одним заданием важнее одной тонны с тремя (18.6)', () => {
  const groups = groupMissions([
    mission('Тонны', 'a'),
    mission('Задания', 'b'),
    mission('Задания', 'b', 'Вторая'),
    mission('Задания', 'b', 'Третья'),
  ])
  const coords = new Map<string, Coords3D>([
    ['a', { x: 10, y: 0, z: 0 }],
    ['b', { x: 10, y: 0, z: 0 }],
  ])

  const plan = planRoute(groups, coords, ORIGIN, FACTS, {
    ...CONTEXT,
    cargoTonsBySystem: new Map([
      ['тонны', 5],
      ['задания', 1],
    ]),
  })

  assert.ok(plan)
  assert.equal(plan.stops[0]?.systemName, 'Тонны')
})
