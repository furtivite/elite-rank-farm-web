import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EMPTY_RESULTS_FILTER,
  filterScoredGroups,
  sortScoredGroups,
} from '@/features/farm-recommender/lib/filterScoredGroups'
import type { ScoredStation, ScoredSystemGroup } from '@/features/farm-recommender/model/types'

function station(name: string, score: number): ScoredStation {
  return {
    station: {
      id: `${name}-id`,
      systemId: 'system',
      name,
      distanceToArrivalLs: 100,
      hasMissionBoard: true,
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-02T00:00:00.000Z',
    },
    factions: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    factionsDataState: 'unknown',
    rating: undefined,
    missionCount: 0,
    score,
    reasons: [],
  }
}

function group(systemName: string, stations: ScoredStation[]): ScoredSystemGroup {
  return {
    systemId: `${systemName}-id`,
    systemName,
    distanceLy: 10,
    stations,
    bestScore: Math.max(...stations.map((entry) => entry.score)),
    missionCount: 0,
  }
}

const groups: ScoredSystemGroup[] = [
  group('Ngalinn', [station('Vonarburg Orbital', 20), station('Kaku Port', 5)]),
  group('HIP 20277', [station('Nemeio Terminal', 12)]),
  group('HIP 9141', [station('Vonarburg Hub', 8)]),
]

test('пустой фильтр отдаёт всю выдачу', () => {
  const result = filterScoredGroups(groups, EMPTY_RESULTS_FILTER)
  assert.deepEqual(
    result.map((entry) => entry.systemName),
    ['Ngalinn', 'HIP 20277', 'HIP 9141'],
  )
})

test('фильтр по системе — подстрока без учёта регистра', () => {
  const result = filterScoredGroups(groups, { system: 'ngal', station: '', ownSideOnly: false })
  assert.deepEqual(
    result.map((entry) => entry.systemName),
    ['Ngalinn'],
  )
})

test('фильтр по станции оставляет только совпавшие станции', () => {
  const result = filterScoredGroups(groups, {
    system: '',
    station: 'vonarburg',
    ownSideOnly: false,
  })

  assert.deepEqual(
    result.map((entry) => entry.systemName),
    ['Ngalinn', 'HIP 9141'],
  )
  assert.deepEqual(
    result[0].stations.map((entry) => entry.station.name),
    ['Vonarburg Orbital'],
  )
})

test('система без оставшихся станций выпадает целиком', () => {
  const result = filterScoredGroups(groups, { system: '', station: 'kaku', ownSideOnly: false })
  assert.deepEqual(
    result.map((entry) => entry.systemName),
    ['Ngalinn'],
  )
})

test('bestScore пересчитывается по оставшимся станциям', () => {
  const [ngalinn] = filterScoredGroups(groups, {
    system: 'ngalinn',
    station: 'kaku',
    ownSideOnly: false,
  })
  assert.equal(ngalinn.bestScore, 5)
})

test('фильтр не меняет исходный массив', () => {
  const before = groups.map((entry) => entry.systemName)
  filterScoredGroups(groups, { system: 'hip', station: '', ownSideOnly: false })
  assert.deepEqual(
    groups.map((entry) => entry.systemName),
    before,
  )
})

test('по умолчанию системы идут по убыванию результата', () => {
  const result = sortScoredGroups(groups, 'score')
  assert.deepEqual(
    result.map((entry) => entry.systemName),
    ['Ngalinn', 'HIP 20277', 'HIP 9141'],
  )
})

test('сортировка по имени A→Z и Z→A, числа сравниваются как числа', () => {
  assert.deepEqual(
    sortScoredGroups(groups, 'name-asc').map((entry) => entry.systemName),
    ['HIP 9141', 'HIP 20277', 'Ngalinn'],
  )
  assert.deepEqual(
    sortScoredGroups(groups, 'name-desc').map((entry) => entry.systemName),
    ['Ngalinn', 'HIP 20277', 'HIP 9141'],
  )
})

test('при равном результате порядок задаёт имя', () => {
  const tied = [group('Beta', [station('B', 10)]), group('Alpha', [station('A', 10)])]
  assert.deepEqual(
    sortScoredGroups(tied, 'score').map((entry) => entry.systemName),
    ['Alpha', 'Beta'],
  )
})

test('фильтр «только моя сторона» оставляет станции под своей фракцией (11)', () => {
  const own = station('Vonarburg Orbital', 20)
  own.station.controllingFaction = { name: 'Aitvas Corp.', allegiance: 'Empire' }
  const foreign = station('Kaku Port', 30)
  foreign.station.controllingFaction = { name: 'Brothers of Mainani', allegiance: 'Independent' }
  const unknownOwner = station('Nemeio Terminal', 25)

  const mixed = [group('Ngalinn', [own, foreign, unknownOwner])]
  const result = filterScoredGroups(mixed, { ...EMPTY_RESULTS_FILTER, ownSideOnly: true }, 'empire')

  assert.deepEqual(
    result[0].stations.map((entry) => entry.station.name),
    ['Vonarburg Orbital'],
  )
  assert.equal(result[0].bestScore, 20)
})

test('без режима фильтр «моя сторона» не применяется', () => {
  const own = station('Vonarburg Orbital', 20)
  own.station.controllingFaction = { name: 'Aitvas Corp.', allegiance: 'Empire' }
  const mixed = [group('Ngalinn', [own, station('Kaku Port', 30)])]

  const result = filterScoredGroups(mixed, { ...EMPTY_RESULTS_FILTER, ownSideOnly: true })

  assert.equal(result[0].stations.length, 2)
})
