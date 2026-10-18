import assert from 'node:assert/strict'
import { test } from 'node:test'
import { countMissionsByStationId, groupMissions } from '@/entities/mission-store/lib/groupMissions'
import { mission } from '@/entities/mission-store/lib/missionFixture'

test('иерархия — система, тело, станция (15)', () => {
  const groups = groupMissions([
    mission({ targetBody: 'Planet A', targetStation: 'Fernandes Base' }),
    mission({ targetBody: 'Planet A', targetStation: 'Fernandes Base' }),
    mission({ targetBody: 'Planet A', targetStation: 'Fernandes Base' }),
    mission({ targetBody: 'Planet B', targetStation: 'Other Station' }),
  ])

  assert.equal(groups.length, 1)
  const [system] = groups
  assert.equal(system.systemName, 'HIP 8060')
  assert.equal(system.missionCount, 4)
  assert.deepEqual(
    system.bodies.map((body) => body.bodyName),
    ['Planet A', 'Planet B'],
  )
  assert.equal(system.bodies[0].stations[0].stationName, 'Fernandes Base')
  assert.equal(system.bodies[0].stations[0].missions.length, 3)
  assert.equal(system.bodies[1].stations[0].missions.length, 1)
})

test('система с большим числом миссий выше (16.1)', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Одна' }),
    mission({ targetSystem: 'Три' }),
    mission({ targetSystem: 'Три' }),
    mission({ targetSystem: 'Три' }),
  ])

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Три', 'Одна'],
  )
})

test('при равном числе миссий выше та, где больше миссий на одной станции (16.2)', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Разбросано', targetStation: 'A' }),
    mission({ targetSystem: 'Разбросано', targetStation: 'B' }),
    mission({ targetSystem: 'Разбросано', targetStation: 'C' }),
    mission({ targetSystem: 'Кучно', targetStation: 'Одна' }),
    mission({ targetSystem: 'Кучно', targetStation: 'Одна' }),
    mission({ targetSystem: 'Кучно', targetStation: 'Одна' }),
  ])

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Кучно', 'Разбросано'],
  )
  assert.equal(groups[0].maxMissionsAtOneStation, 3)
  assert.equal(groups[0].stationCount, 1)
  assert.equal(groups[1].stationCount, 3)
})

test('при равенстве по станциям выше та, где меньше разных тел (16.4)', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Одно тело', targetStation: 'A', targetBody: 'P1' }),
    mission({ targetSystem: 'Одно тело', targetStation: 'B', targetBody: 'P1' }),
    mission({ targetSystem: 'Два тела', targetStation: 'A', targetBody: 'P1' }),
    mission({ targetSystem: 'Два тела', targetStation: 'B', targetBody: 'P2' }),
  ])

  assert.deepEqual(
    groups.map((group) => group.systemName),
    ['Одно тело', 'Два тела'],
  )
})

test('миссии без тела не получают выдуманное имя тела', () => {
  const groups = groupMissions([mission({ targetStation: 'Орбитальная' })])

  assert.equal(groups[0].bodies.length, 1)
  assert.equal(groups[0].bodies[0].bodyName, null)
})

test('тело без имени идёт последним', () => {
  const groups = groupMissions([
    mission({ targetStation: 'Орбитальная' }),
    mission({ targetStation: 'На планете', targetBody: 'Planet A' }),
  ])

  assert.deepEqual(
    groups[0].bodies.map((body) => body.bodyName),
    ['Planet A', null],
  )
})

test('одноимённые станции в разных системах не сливаются', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Первая', targetStation: 'Одинаковое имя' }),
    mission({ targetSystem: 'Вторая', targetStation: 'Одинаковое имя' }),
  ])

  assert.equal(groups.length, 2)
  assert.equal(groups[0].stationCount, 1)
  assert.equal(groups[1].stationCount, 1)
})

test('невыполненные миссии внутри станции идут первыми', () => {
  const groups = groupMissions([
    mission({ completed: true }),
    mission(),
    mission({ completed: true }),
  ])

  const station = groups[0].bodies[0].stations[0]
  assert.deepEqual(
    station.missions.map((entry) => entry.completed === true),
    [false, true, true],
  )
  assert.equal(station.completedCount, 2)
  assert.equal(groups[0].completedCount, 2)
})

test('счётчик по id станции считает только цели из Galaxy Data', () => {
  const counts = countMissionsByStationId([
    mission({ targetStationId: '42' }),
    mission({ targetStationId: '42' }),
    mission({ targetStationId: '7' }),
    mission(),
  ])

  assert.equal(counts.get('42'), 2)
  assert.equal(counts.get('7'), 1)
  assert.equal(counts.size, 2)
})

test('пустой список даёт пустое дерево', () => {
  assert.deepEqual(groupMissions([]), [])
})

test('станция, где все задания ждут товара, уходит вниз своей системы (70.6)', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Ngalinn', targetStation: 'Alpha', awaitingCargo: true }),
    mission({ targetSystem: 'Ngalinn', targetStation: 'Alpha', awaitingCargo: true }),
    mission({ targetSystem: 'Ngalinn', targetStation: 'Beta' }),
  ])
  const stations = groups[0].bodies[0].stations

  assert.deepEqual(
    stations.map((station) => station.stationName),
    ['Beta', 'Alpha'],
  )
  assert.equal(groups[0].awaitingCount, 2)
})
