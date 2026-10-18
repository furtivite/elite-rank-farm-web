import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupStationsByBody } from '@/features/farm-recommender/lib/groupStationsByBody'
import type { ScoredStation } from '@/features/farm-recommender'

function station(
  id: string,
  bodyName: string | undefined,
  score: number,
  distanceToArrivalLs?: number,
): ScoredStation {
  return {
    station: {
      id,
      systemId: 'sys',
      name: `Station ${id}`,
      bodyName,
      distanceToArrivalLs,
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-01T00:00:00Z',
    },
    factions: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    factionsDataState: 'unknown',
    rating: undefined,
    missionCount: 0,
    score,
    reasons: [],
  }
}

test('группирует станции по телу', () => {
  const groups = groupStationsByBody([
    station('a', 'Planet A', 80),
    station('b', 'Planet B', 70),
    station('c', 'Planet A', 60),
  ])

  assert.equal(groups.length, 2)
  assert.deepEqual(
    groups.map((group) => group.bodyName),
    ['Planet A', 'Planet B'],
  )
  assert.equal(groups[0].stations.length, 2)
})

test('станции без тела попадают в отдельную группу', () => {
  const groups = groupStationsByBody([station('a', undefined, 80), station('b', '  ', 70)])

  assert.equal(groups.length, 1)
  assert.equal(groups[0].bodyName, null)
  assert.equal(groups[0].stations.length, 2)
})

test('группы тел отсортированы от лучшей к худшей (41.7)', () => {
  const groups = groupStationsByBody([station('a', 'Planet A', 50), station('b', 'Planet B', 90)])

  assert.deepEqual(
    groups.map((group) => group.bodyName),
    ['Planet B', 'Planet A'],
  )
})

test('станции внутри группы сохраняют порядок по score', () => {
  const groups = groupStationsByBody([station('a', 'Planet A', 90), station('b', 'Planet A', 40)])

  assert.deepEqual(
    groups[0].stations.map((scored) => scored.station.id),
    ['a', 'b'],
  )
})

test('у тела считается сумма взятых миссий (41.8)', () => {
  const withMissions = (id: string, count: number) => {
    const scored = station(id, 'Planet A', 50)
    return { ...scored, missionCount: count }
  }

  const groups = groupStationsByBody([withMissions('a', 2), withMissions('b', 3)])
  assert.equal(groups[0].missionCount, 5)
})

test('лучший score группы считается по всем её станциям', () => {
  const groups = groupStationsByBody([station('a', 'Planet A', 40), station('b', 'Planet A', 90)])

  assert.equal(groups[0].bestScore, 90)
})

test('имя тела не сталкивается с группой без тела', () => {
  const groups = groupStationsByBody([station('a', undefined, 10), station('b', 'orbit', 20)])

  assert.equal(groups.length, 2)
  assert.deepEqual(
    groups.map((group) => group.bodyName),
    ['orbit', null],
  )
})

test('ближнее тело выше дальнего, даже если лучшая станция на дальнем (68.2)', () => {
  const groups = groupStationsByBody([
    station('far', 'Planet Far', 95, 187_532),
    station('near', 'Planet Near', 20, 6),
  ])

  assert.deepEqual(
    groups.map((group) => group.bodyName),
    ['Planet Near', 'Planet Far'],
  )
})

test('расстояние группы — по ближайшей её станции, а не по первой пришедшей', () => {
  const groups = groupStationsByBody([
    station('outer', 'Planet A', 50, 900),
    station('inner', 'Planet A', 10, 120),
    station('other', 'Planet B', 90, 500),
  ])

  assert.deepEqual(
    groups.map((group) => group.bodyName),
    ['Planet A', 'Planet B'],
  )
  assert.equal(groups[0].nearestLs, 120)
})

test('тело без известных расстояний идёт после тел с известными', () => {
  const groups = groupStationsByBody([
    station('unknown', 'Planet Unknown', 99),
    station('known', 'Planet Known', 1, 4000),
  ])

  assert.deepEqual(
    groups.map((group) => group.bodyName),
    ['Planet Known', 'Planet Unknown'],
  )
})

function scoredAt(
  name: string,
  type: string,
  distanceToArrivalLs: number | undefined,
  score: number,
  missionCount = 0,
): ScoredStation {
  return {
    station: {
      id: name,
      systemId: 'sys',
      name,
      bodyName: 'Planet A',
      type,
      distanceToArrivalLs,
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-06T00:00:00Z',
    },
    factions: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    factionsDataState: 'unknown',
    rating: undefined,
    missionCount,
    score,
    reasons: [],
  } as unknown as ScoredStation
}

test('орбитальная станция тела идёт раньше наземных (68.3)', () => {
  const [group] = groupStationsByBody([
    scoredAt('Наземная ближняя', 'Planetary Outpost', 500, 40),
    scoredAt('Орбитальная', 'Coriolis Starport', 900, 10),
  ])

  assert.deepEqual(
    group.stations.map((entry) => entry.station.name),
    ['Орбитальная', 'Наземная ближняя'],
  )
})

test('наземные внутри тела идут от ближней к дальней', () => {
  const [group] = groupStationsByBody([
    scoredAt('Дальняя', 'Planetary Port', 5000, 50),
    scoredAt('Ближняя', 'Planetary Outpost', 300, 10),
  ])

  assert.deepEqual(
    group.stations.map((entry) => entry.station.name),
    ['Ближняя', 'Дальняя'],
  )
})

test('число заданий не двигает станцию внутри группы (68.3)', () => {
  const [group] = groupStationsByBody([
    scoredAt('Наземная с заданиями', 'Planetary Outpost', 9000, 95, 4),
    scoredAt('Орбитальная пустая', 'Coriolis Starport', 200, 5, 0),
  ])

  assert.deepEqual(
    group.stations.map((entry) => entry.station.name),
    ['Орбитальная пустая', 'Наземная с заданиями'],
  )
})

test('станция с неизвестным типом идёт после распознанных, но остаётся', () => {
  const [group] = groupStationsByBody([
    scoredAt('Неизвестная', '', 100, 90),
    scoredAt('Наземная', 'Planetary Outpost', 800, 10),
    scoredAt('Орбитальная', 'Orbis Starport', 900, 10),
  ])

  assert.deepEqual(
    group.stations.map((entry) => entry.station.name),
    ['Орбитальная', 'Наземная', 'Неизвестная'],
  )
})
