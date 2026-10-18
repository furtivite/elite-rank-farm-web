import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ClusterMetrics, RegionClusters } from '@/entities/galaxy-data'
import {
  clusterFilterKey,
  discoverClusters,
} from '@/features/farm-recommender/lib/discoverClusters'

function metrics(overrides: Partial<ClusterMetrics> = {}): ClusterMetrics {
  return {
    systems: 1,
    stations: 1,
    stationsNearStar: 1,
    medianArrivalLs: 100,
    ...overrides,
  }
}

function clusters(
  candidates: Array<{ name: string; x: number; byFilter: Record<string, ClusterMetrics> }>,
): RegionClusters {
  return {
    schemaVersion: 1,
    generatedAt: '2026-09-07T00:00:00Z',
    regionId: 'imperial-ngalinn',
    radiusLy: 15,
    nearStarLs: 500,
    candidates: candidates.map((entry) => ({
      systemName: entry.name,
      x: entry.x,
      y: 0,
      z: 0,
      byFilter: entry.byFilter,
    })),
  }
}

test('первым идёт кластер с бо́льшим числом ближних станций', () => {
  const found = discoverClusters({
    clusters: clusters([
      {
        name: 'Размазанный',
        x: 0,
        byFilter: { 'any:all': metrics({ stations: 20, stationsNearStar: 2 }) },
      },
      {
        name: 'Тесный',
        x: 40,
        byFilter: { 'any:all': metrics({ stations: 20, stationsNearStar: 15 }) },
      },
    ]),
  })

  assert.equal(found[0].centerSystem, 'Тесный')
  assert.equal(found[0].radiusLy, 15, 'радиус берётся из данных, а не из константы')
})

test('при равенстве ближних решает общее число станций', () => {
  const found = discoverClusters({
    clusters: clusters([
      {
        name: 'Меньше',
        x: 0,
        byFilter: { 'any:all': metrics({ stations: 5, stationsNearStar: 3 }) },
      },
      {
        name: 'Больше',
        x: 40,
        byFilter: { 'any:all': metrics({ stations: 9, stationsNearStar: 3 }) },
      },
    ]),
  })

  assert.equal(found[0].centerSystem, 'Больше')
})

test('соседние центры не занимают весь список одним и тем же местом', () => {
  const found = discoverClusters({
    clusters: clusters([
      { name: 'Центр', x: 0, byFilter: { 'any:all': metrics({ stationsNearStar: 9 }) } },
      { name: 'Рядом 1', x: 2, byFilter: { 'any:all': metrics({ stationsNearStar: 8 }) } },
      { name: 'Рядом 2', x: 4, byFilter: { 'any:all': metrics({ stationsNearStar: 7 }) } },
      { name: 'Далеко', x: 40, byFilter: { 'any:all': metrics({ stationsNearStar: 6 }) } },
    ]),
  })

  assert.deepEqual(
    found.map((entry) => entry.centerSystem),
    ['Центр', 'Далеко'],
  )
})

test('центр без предпосчёта под этот фильтр не предлагается', () => {
  const found = discoverClusters({
    clusters: clusters([
      { name: 'Только малые', x: 0, byFilter: { 'any:all': metrics() } },
      { name: 'Есть большая', x: 40, byFilter: { 'any:all': metrics(), 'L:all': metrics() } },
    ]),
    padSize: 'L',
  })

  assert.deepEqual(
    found.map((entry) => entry.centerSystem),
    ['Есть большая'],
  )
})

test('limit ограничивает число предложений', () => {
  const found = discoverClusters({
    clusters: clusters([
      { name: 'A', x: 0, byFilter: { 'any:all': metrics() } },
      { name: 'B', x: 40, byFilter: { 'any:all': metrics() } },
      { name: 'C', x: 80, byFilter: { 'any:all': metrics() } },
    ]),
    limit: 2,
  })

  assert.equal(found.length, 2)
})

test('ключ фильтра: S неотличим от «любой», потому что малый корабль садится куда угодно', () => {
  assert.equal(clusterFilterKey(undefined, false), 'any:all')
  assert.equal(clusterFilterKey('S', false), 'any:all')
  assert.equal(clusterFilterKey('M', false), 'M:all')
  assert.equal(clusterFilterKey('L', true), 'L:orbital')
})
