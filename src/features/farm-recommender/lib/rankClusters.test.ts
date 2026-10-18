import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import type { CachedStation } from '@/entities/galaxy-data'
import type { StationRatingsMap } from '@/entities/station-rating'
import {
  CLUSTER_TOP_STATIONS,
  rankClusters,
  type ClusterSearchResult,
} from '@/features/farm-recommender/lib/rankClusters'
import type { RawSystemGroup } from '@/features/farm-recommender/model/types'

const en = createTranslate('en')

const NEAR_SCORE = 16

function station(id: string, distanceToArrivalLs: number): CachedStation {
  return {
    id,
    systemId: 'system',
    name: id,
    distanceToArrivalLs,
    hasMissionBoard: true,
    missionProviderFactions: { status: 'unknown' },
    updatedAt: '2026-09-02T00:00:00.000Z',
  }
}

function group(systemName: string, stations: CachedStation[]): RawSystemGroup {
  return {
    systemId: `${systemName}-id`,
    systemName,
    distanceLy: 10,
    stations,
    systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
  }
}

function entry(name: string, groups: RawSystemGroup[]): ClusterSearchResult {
  return { clusterId: name === 'Auto discovery' ? null : name, name, groups }
}

const noRatings: StationRatingsMap = {}

test('кластер из нескольких хороших станций обгоняет кластер с одной', () => {
  const many = entry('Ngalinn', [
    group('Ngalinn', [station('a', 100), station('b', 100), station('c', 100)]),
  ])
  const single = entry('Auto discovery', [group('HIP 9141', [station('d', 100)])])

  const ranked = rankClusters(en, [single, many], noRatings)

  assert.deepEqual(
    ranked.map((summary) => summary.name),
    ['Ngalinn', 'Auto discovery'],
  )
  assert.equal(ranked[0].stationCount, 3)
  assert.equal(ranked[0].topScore, NEAR_SCORE * 3)
  assert.equal(ranked[0].bestScore, NEAR_SCORE)
})

test('в сумму идут только лучшие станции, а не весь хвост', () => {
  const stations = Array.from({ length: CLUSTER_TOP_STATIONS + 3 }, (_, index) =>
    station(`s${index}`, index < CLUSTER_TOP_STATIONS ? 100 : 50000),
  )
  const long = entry('Длинный хвост', [group('Ngalinn', stations)])
  const short = entry('Пятёрка', [group('HIP 9141', stations.slice(0, CLUSTER_TOP_STATIONS))])

  const ranked = rankClusters(en, [long, short], noRatings)

  assert.equal(ranked[0].topScore, ranked[1].topScore)
  assert.equal(ranked[0].topScore, NEAR_SCORE * CLUSTER_TOP_STATIONS)
})

test('пустой кластер уходит вниз даже к отрицательному соседу', () => {
  const bad = entry('Слабый', [group('Ngalinn', [station('a', 50000)])])
  const empty = entry('Пустой', [])
  const ratings: StationRatingsMap = {
    a: { rating: 'bad', updatedAt: '2026-09-04T00:00:00.000Z' },
  }

  const ranked = rankClusters(en, [empty, bad], ratings)

  assert.deepEqual(
    ranked.map((summary) => summary.name),
    ['Слабый', 'Пустой'],
  )
  assert.equal(ranked[0].topScore, -15)
  assert.equal(ranked[1].stationCount, 0)
})

test('заблокированные станции в кластер не считаются', () => {
  const ratings: StationRatingsMap = {
    a: { rating: 'blocked', updatedAt: '2026-09-04T00:00:00.000Z' },
  }
  const ranked = rankClusters(
    en,
    [entry('Ngalinn', [group('Ngalinn', [station('a', 100), station('b', 100)])])],
    ratings,
  )

  assert.equal(ranked[0].stationCount, 1)
  assert.equal(ranked[0].topScore, NEAR_SCORE)
})
