import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { _resetGalaxyDataProviderCacheForTests } from '@/entities/galaxy-data/api/galaxyDataProvider'
import type { CachedSystem, SystemIndexEntry } from '@/entities/galaxy-data/model/types'
import type { StationRatingsMap } from '@/entities/station-rating'
import { loadBlockedBases } from '@/features/blocked-bases/lib/loadBlockedBases'

const EMPTY_SUMMARY = { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 }

function system(id: string, name: string, stationIds: readonly string[]): CachedSystem {
  return {
    id,
    name,
    x: 0,
    y: 0,
    z: 0,
    regionIds: ['imperial-ngalinn'],
    updatedAt: '2026-09-01T00:00:00Z',
    systemFactions: [],
    systemFactionSummary: EMPTY_SUMMARY,
    stations: stationIds.map((stationId) => ({
      id: stationId,
      systemId: id,
      name: `Station ${stationId}`,
      missionProviderFactions: { status: 'unknown' } as const,
      updatedAt: '2026-09-01T00:00:00Z',
    })),
  }
}

const INDEX: SystemIndexEntry[] = [
  { id: 'sys-a', name: 'Alpha', x: 0, y: 0, z: 0, chunk: 'chunks/chunk-001.json' },
  { id: 'sys-b', name: 'Beta', x: 1, y: 0, z: 0, chunk: 'chunks/chunk-002.json' },
]
const CHUNK_1 = [system('sys-a', 'Alpha', ['st-a'])]
const CHUNK_2 = [system('sys-b', 'Beta', ['st-b'])]

let fetchCalls: string[] = []
const originalFetch = global.fetch

beforeEach(() => {
  _resetGalaxyDataProviderCacheForTests()
  fetchCalls = []
  global.fetch = (async (input: string | URL) => {
    const url = String(input)
    fetchCalls.push(url)

    if (url.endsWith('/data/galaxy/meta.json')) {
      return new Response(JSON.stringify({ regionId: 'galaxy' }), { status: 200 })
    }
    if (url.endsWith('/data/galaxy/systems.json')) {
      return new Response(JSON.stringify(INDEX), { status: 200 })
    }
    if (url.endsWith('/data/galaxy/chunks/chunk-001.json')) {
      return new Response(JSON.stringify(CHUNK_1), { status: 200 })
    }
    if (url.endsWith('/data/galaxy/chunks/chunk-002.json')) {
      return new Response(JSON.stringify(CHUNK_2), { status: 200 })
    }

    return new Response('not found', { status: 404, statusText: 'Not Found' })
  }) as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
})

const chunkFetches = () => fetchCalls.filter((url) => url.includes('/chunks/')).length

test('без заблокированных станций сеть не трогается', async () => {
  const ratings: StationRatingsMap = {
    'st-a': { rating: 'good', updatedAt: '2026-09-01T00:00:00Z' },
  }

  const result = await loadBlockedBases(ratings)

  assert.deepEqual(result.bases, [])
  assert.equal(fetchCalls.length, 0)
})

test('с известными системой и именем читается только чанк этой системы', async () => {
  const ratings: StationRatingsMap = {
    'st-a': {
      rating: 'blocked',
      systemId: 'sys-a',
      systemName: 'Alpha',
      updatedAt: '2026-09-01T00:00:00Z',
    },
  }

  const result = await loadBlockedBases(ratings)

  assert.deepEqual(
    result.bases.map((base) => base.station.id),
    ['st-a'],
  )
  assert.equal(result.bases[0].systemName, 'Alpha')
  assert.equal(chunkFetches(), 1, 'чанк второй системы скачивать незачем')
  assert.deepEqual(result.resolvedSystemIds, {}, 'указатель и имя уже были — дозаписывать нечего')
})

test('запись без указателя находится обходом региона и возвращает его', async () => {
  const ratings: StationRatingsMap = {
    'st-b': { rating: 'blocked', updatedAt: '2026-09-01T00:00:00Z' },
  }

  const result = await loadBlockedBases(ratings)

  assert.deepEqual(
    result.bases.map((base) => base.station.id),
    ['st-b'],
  )
  assert.equal(chunkFetches(), 2)
  assert.deepEqual(result.resolvedSystemIds, {
    'st-b': { systemId: 'sys-b', systemName: 'Beta' },
  })
})

test('метаданные станции читаются заново, а не из rating entry (раздел 22)', async () => {
  const ratings: StationRatingsMap = {
    'st-a': {
      rating: 'blocked',
      systemId: 'sys-a',
      note: 'мешает',
      blockedAt: '2026-09-02T00:00:00Z',
      updatedAt: '2026-09-02T00:00:00Z',
    },
  }

  const result = await loadBlockedBases(ratings)

  assert.equal(result.bases[0].station.name, 'Station st-a')
  assert.equal(result.bases[0].note, 'мешает')
  assert.equal(result.bases[0].blockedAt, '2026-09-02T00:00:00Z')
})
