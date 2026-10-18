import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupMissions } from '@/entities/mission-store/lib/groupMissions'
import { jumpsAt, mission } from '@/entities/mission-store/lib/missionFixture'

test('станция, куда не сесть, уходит вниз списка (71.3)', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'Нельзя сесть', targetStationId: 'no-pad' }),
      mission({ targetStation: 'Можно сесть', targetStationId: 'ok' }),
    ],
    { canLandAt: (station) => station.stationId !== 'no-pad' },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['Можно сесть', 'Нельзя сесть'],
  )
})

test('система, где сесть некуда ни на одну станцию, идёт после других (71.3)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Некуда сесть', targetStation: 'A', targetStationId: 'no-pad' }),
      mission({ targetSystem: 'Есть куда', targetStation: 'B', targetStationId: 'ok' }),
    ],
    { canLandAt: (station) => station.stationId !== 'no-pad' },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Есть куда', 'Некуда сесть'],
  )
})

test('одной непосадочной станции мало, чтобы увести систему вниз (71.3)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Смешанная', targetStation: 'A', targetStationId: 'no-pad' }),
      mission({ targetSystem: 'Смешанная', targetStation: 'B', targetStationId: 'ok' }),
      mission({ targetSystem: 'Целиком годная', targetStation: 'C', targetStationId: 'ok2' }),
      mission({ targetSystem: 'Целиком годная', targetStation: 'D', targetStationId: 'ok3' }),
    ],
    { canLandAt: (station) => station.stationId !== 'no-pad' },
  )

  assert.equal(groups.length, 2)
  assert.equal(
    groups.every((group) => group.missionCount === 2),
    true,
  )
})

test('система, где сесть некуда, уходит вниз даже ближняя (71, ответ 2026-09-10)', () => {
  const groups = groupMissions(
    [
      mission({
        targetSystem: 'Рядом, сесть некуда',
        targetSystemId: 'near',
        targetStation: 'A',
        targetStationId: 'no-pad',
      }),
      mission({
        targetSystem: 'Далеко, сесть есть куда',
        targetSystemId: 'far',
        targetStation: 'B',
        targetStationId: 'ok',
      }),
    ],
    {
      canLandAt: (station) => station.stationId !== 'no-pad',
      jumps: new Map([
        ['near', jumpsAt(5)],
        ['far', jumpsAt(400)],
      ]),
    },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Далеко, сесть есть куда', 'Рядом, сесть некуда'],
  )
})

test('без предиката порядок прежний: выключенный флаг ничего не меняет (71.3)', () => {
  const missions = [
    mission({ targetStation: 'A', targetStationId: 'a' }),
    mission({ targetStation: 'B', targetStationId: 'b' }),
  ]

  assert.deepEqual(
    groupMissions(missions).map((group) => group.bodies[0].stations.map((s) => s.stationName)),
    groupMissions(missions, {}).map((group) => group.bodies[0].stations.map((s) => s.stationName)),
  )
})

test('ближняя станция раньше дальней, даже если миссий на ней меньше (68.2)', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'Далеко', targetStationId: 'far' }),
      mission({ targetStation: 'Далеко', targetStationId: 'far' }),
      mission({ targetStation: 'Близко', targetStationId: 'near' }),
    ],
    {
      stationDistanceLs: new Map([
        ['far', 187_532],
        ['near', 6],
      ]),
    },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['Близко', 'Далеко'],
  )
})

test('система с неизвестным расстоянием не уезжает наверх (90, 12)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Близко', targetSystemId: 'near' }),
      mission({ targetSystem: 'Близко', targetSystemId: 'near' }),
      mission({ targetSystem: 'Неизвестно', targetSystemId: 'unknown' }),
    ],
    { jumps: new Map([['near', jumpsAt(5)]]) },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Близко', 'Неизвестно'],
  )
})

test('станция у другой звезды уходит вниз, даже если ближе по ls (86.8)', () => {
  const groups = groupMissions(
    [
      mission({ targetStation: 'У второй звезды', targetStationId: 'other' }),
      mission({ targetStation: 'У главной', targetStationId: 'main' }),
    ],
    {
      stationDistanceLs: new Map([
        ['other', 100],
        ['main', 5000],
      ]),
      atOtherStar: (station) => station.stationId === 'other',
    },
  )

  assert.deepEqual(
    groups[0].bodies[0].stations.map((station) => station.stationName),
    ['У главной', 'У второй звезды'],
  )
})

test('система, где все станции у другой звезды, идёт после остальных (86.8)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Двойная', targetStation: 'A', targetStationId: 'other' }),
      mission({ targetSystem: 'Двойная', targetStation: 'A', targetStationId: 'other' }),
      mission({ targetSystem: 'Обычная', targetStation: 'B', targetStationId: 'main' }),
    ],
    { atOtherStar: (station) => station.stationId === 'other' },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Обычная', 'Двойная'],
  )
})

test('без сведений о звезде порядок прежний (86.8, 80.2)', () => {
  const groups = groupMissions(
    [
      mission({ targetSystem: 'Двойная', targetStation: 'A', targetStationId: 'other' }),
      mission({ targetSystem: 'Двойная', targetStation: 'A', targetStationId: 'other' }),
      mission({ targetSystem: 'Обычная', targetStation: 'B', targetStationId: 'main' }),
    ],
    { atOtherStar: () => false },
  )

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Двойная', 'Обычная'],
  )
})
