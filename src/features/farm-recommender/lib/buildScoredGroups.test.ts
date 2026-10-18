import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import type { CachedStation } from '@/entities/galaxy-data'
import type { StationRatingsMap } from '@/entities/station-rating'
import type { StoredMission } from '@/entities/mission-store'
import { buildScoredGroups } from '@/features/farm-recommender/lib/buildScoredGroups'
import type { RawSystemGroup } from '@/features/farm-recommender/model/types'

const en = createTranslate('en')

function makeStation(id: string, overrides: Partial<CachedStation> = {}): CachedStation {
  return {
    id,
    systemId: 'sys-1',
    name: id,
    missionProviderFactions: { status: 'unknown' },
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

const summary = { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 }

test('buildScoredGroups: заблокированная станция остаётся помеченной, а не исчезает (96)', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys-1',
      systemName: 'Sys A',
      distanceLy: 5,
      stations: [makeStation('a'), makeStation('b')],
      systemFactionSummary: summary,
    },
  ]
  const ratings: StationRatingsMap = {
    a: { rating: 'blocked', missionCount: 0, updatedAt: '2026-09-01T00:00:00Z' },
  }

  const result = buildScoredGroups(en, raw, ratings)

  assert.equal(result.length, 1)
  assert.equal(result[0].stations.length, 2, 'обе станции остаются в выдаче')
  assert.equal(
    result[0].stations.find((scored) => scored.station.id === 'a')?.rating,
    'blocked',
    'заблокированная помечена, чтобы её было видно',
  )
})

test('buildScoredGroups: заблокированная станция не поднимает систему (96)', () => {
  const stations = [makeStation('a', { distanceToArrivalLs: 10 }), makeStation('b')]
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys-1',
      systemName: 'Sys A',
      distanceLy: 5,
      stations,
      systemFactionSummary: summary,
    },
  ]

  const open = buildScoredGroups(en, raw, {})
  const withBlocked = buildScoredGroups(en, raw, {
    a: { rating: 'blocked', missionCount: 0, updatedAt: '2026-09-01T00:00:00Z' },
  })

  const bestOfA = open[0].stations.find((scored) => scored.station.id === 'a')?.score ?? 0
  assert.ok(bestOfA > 0, 'ближняя станция и правда лучшая — иначе проверка ниже пуста')
  assert.notEqual(withBlocked[0].bestScore, bestOfA)
  assert.equal(
    withBlocked[0].bestScore,
    withBlocked[0].stations.find((scored) => scored.station.id === 'b')?.score,
  )
})

test('buildScoredGroups: если все станции системы заблокированы, система целиком пропадает', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys-1',
      systemName: 'Sys A',
      distanceLy: 5,
      stations: [makeStation('a')],
      systemFactionSummary: summary,
    },
  ]
  const ratings: StationRatingsMap = {
    a: { rating: 'blocked', missionCount: 0, updatedAt: '2026-09-01T00:00:00Z' },
  }

  assert.equal(buildScoredGroups(en, raw, ratings).length, 0)
})

test('buildScoredGroups: станции внутри системы отсортированы по близости (68.2)', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys-1',
      systemName: 'Sys A',
      distanceLy: 5,
      stations: [
        makeStation('far', { distanceToArrivalLs: 50000 }),
        makeStation('near', { distanceToArrivalLs: 100 }),
      ],
      systemFactionSummary: summary,
    },
  ]

  const [group] = buildScoredGroups(en, raw, {})
  assert.deepEqual(
    group.stations.map((s) => s.station.id),
    ['near', 'far'],
  )
})

test('buildScoredGroups: ближняя станция выше дальней, даже когда score у дальней больше (68.2)', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys-1',
      systemName: 'Sys A',
      distanceLy: 5,
      stations: [
        makeStation('far-good', { distanceToArrivalLs: 187_532 }),
        makeStation('near-plain', { distanceToArrivalLs: 6 }),
      ],
      systemFactionSummary: summary,
    },
  ]
  const ratings: StationRatingsMap = {
    'far-good': { rating: 'good', missionCount: 0, updatedAt: '2026-09-01T00:00:00Z' },
  }
  const missions: StoredMission[] = [
    {
      id: 'm1',
      targetSystem: 'Sys A',
      targetStation: 'far-good',
      targetStationId: 'far-good',
      addedAt: '2026-09-06T10:00:00.000Z',
      completed: false,
    },
  ]

  const [group] = buildScoredGroups(en, raw, ratings, missions)

  assert.deepEqual(
    group.stations.map((s) => s.station.id),
    ['near-plain', 'far-good'],
  )
  assert.equal(group.bestScore, Math.max(...group.stations.map((s) => s.score)))
  assert.equal(group.bestScore, group.stations[1].score)
})

test('buildScoredGroups: станция с неизвестной DTA идёт после известных, а не считается дальней', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys-1',
      systemName: 'Sys A',
      distanceLy: 5,
      stations: [makeStation('unknown'), makeStation('known', { distanceToArrivalLs: 9000 })],
      systemFactionSummary: summary,
    },
  ]

  const [group] = buildScoredGroups(en, raw, {})

  assert.deepEqual(
    group.stations.map((s) => s.station.id),
    ['known', 'unknown'],
  )
})

test('buildScoredGroups: при равном score ближе — выше', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'far',
      systemName: 'Far',
      distanceLy: 30,
      stations: [makeStation('x')],
      systemFactionSummary: summary,
    },
    {
      systemId: 'near',
      systemName: 'Near',
      distanceLy: 2,
      stations: [makeStation('y')],
      systemFactionSummary: summary,
    },
  ]

  const groups = buildScoredGroups(en, raw, {})
  assert.deepEqual(
    groups.map((g) => g.systemId),
    ['near', 'far'],
  )
})

test('buildScoredGroups: системы отсортированы от лучшей к худшей (41.7)', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'near-bad',
      systemName: 'Near',
      distanceLy: 2,
      stations: [makeStation('bad')],
      systemFactionSummary: summary,
    },
    {
      systemId: 'far-good',
      systemName: 'Far',
      distanceLy: 30,
      stations: [makeStation('good')],
      systemFactionSummary: summary,
    },
  ]

  const groups = buildScoredGroups(en, raw, {
    good: { rating: 'good', missionCount: 0, updatedAt: '2026-09-01T00:00:00Z' },
    bad: { rating: 'bad', missionCount: 0, updatedAt: '2026-09-01T00:00:00Z' },
  })

  assert.deepEqual(
    groups.map((g) => g.systemId),
    ['far-good', 'near-bad'],
  )
  assert.ok(groups[0].bestScore > groups[1].bestScore)
})

test('buildScoredGroups: у системы считается сумма взятых миссий (41.8)', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys',
      systemName: 'Sys',
      distanceLy: 5,
      stations: [makeStation('a'), makeStation('b')],
      systemFactionSummary: summary,
    },
  ]

  const mission = (id: string, stationId: string): StoredMission => ({
    id,
    targetSystem: 'Sys',
    targetSystemId: 'sys',
    targetStation: stationId,
    targetStationId: stationId,
    addedAt: '2026-09-02T10:00:00.000Z',
  })

  const [group] = buildScoredGroups(en, raw, {}, [
    mission('m1', 'a'),
    mission('m2', 'a'),
    mission('m3', 'a'),
    mission('m4', 'b'),
    mission('m5', 'b'),
  ])

  assert.equal(group.missionCount, 5)
  assert.equal(group.stations.find((entry) => entry.station.id === 'a')?.missionCount, 3)
})

test('buildScoredGroups: без миссий счётчики нулевые', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys',
      systemName: 'Sys',
      distanceLy: 5,
      stations: [makeStation('a')],
      systemFactionSummary: summary,
    },
  ]

  const [group] = buildScoredGroups(en, raw, {})
  assert.equal(group.missionCount, 0)
})

test('buildScoredGroups: система с четырьмя миссиями выше системы с двумя (16.1)', () => {
  const mission = (id: string, systemId: string, stationId: string): StoredMission => ({
    id,
    targetSystem: systemId,
    targetSystemId: systemId,
    targetStation: stationId,
    targetStationId: stationId,
    addedAt: '2026-09-02T10:00:00.000Z',
  })

  const raw: RawSystemGroup[] = [
    {
      systemId: 'две-миссии',
      systemName: 'Две миссии',
      distanceLy: 5,
      stations: [makeStation('одна', { distanceToArrivalLs: 300 })],
      systemFactionSummary: summary,
    },
    {
      systemId: 'четыре-миссии',
      systemName: 'Четыре миссии',
      distanceLy: 5,
      stations: [
        makeStation('первая', { distanceToArrivalLs: 796 }),
        makeStation('вторая', { distanceToArrivalLs: 796 }),
      ],
      systemFactionSummary: summary,
    },
  ]

  const groups = buildScoredGroups(en, raw, {}, [
    mission('m1', 'две-миссии', 'одна'),
    mission('m2', 'две-миссии', 'одна'),
    mission('m3', 'четыре-миссии', 'первая'),
    mission('m4', 'четыре-миссии', 'первая'),
    mission('m5', 'четыре-миссии', 'вторая'),
    mission('m6', 'четыре-миссии', 'вторая'),
  ])

  assert.deepEqual(
    groups.map((group) => group.systemId),
    ['четыре-миссии', 'две-миссии'],
  )
  assert.equal(groups[0].missionCount, 4)
})

test('buildScoredGroups: миссии на станции вне выдачи всё равно считаются за систему', () => {
  const raw: RawSystemGroup[] = [
    {
      systemId: 'sys',
      systemName: 'Sys',
      distanceLy: 5,
      stations: [makeStation('видимая')],
      systemFactionSummary: summary,
    },
  ]

  const [group] = buildScoredGroups(en, raw, {}, [
    {
      id: 'm1',
      targetSystem: 'Sys',
      targetSystemId: 'sys',
      targetStation: 'невидимая',
      targetStationId: 'невидимая',
      addedAt: '2026-09-02T10:00:00.000Z',
    },
  ])

  assert.equal(group.missionCount, 1)
  assert.ok(
    group.stations[0].reasons.some((reason) => reason.label.includes('in the system')),
    'станция должна получить бонус за миссию в своей системе',
  )
})
