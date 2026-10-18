import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import {
  _resetGalaxyDataProviderCacheForTests,
  getStations,
  getSystem,
  getSystemsByIds,
  getSystemsInRadius,
  getSystemsWithStationsInRadius,
  refreshSystem,
  resolveSystemCoords,
} from '@/entities/galaxy-data/api/galaxyDataProvider'
import type { CachedSystem, SystemIndexEntry } from '@/entities/galaxy-data/model/types'

const NGALINN = { id: 'sys-1', name: 'Ngalinn' }

const SYSTEMS_INDEX: SystemIndexEntry[] = [
  {
    id: 'sys-1',
    name: 'Ngalinn',
    x: 8.625,
    y: -219.84375,
    z: -60.84375,
    chunk: 'chunks/chunk-001.json',
  },
  { id: 'sys-2', name: 'Near System', x: 15, y: -220, z: -60, chunk: 'chunks/chunk-001.json' },
  { id: 'sys-3', name: 'Far System', x: 5000, y: 0, z: 0, chunk: 'chunks/chunk-002.json' },
]

const CHUNK_1: CachedSystem[] = [
  {
    id: 'sys-1',
    name: 'Ngalinn',
    x: 8.625,
    y: -219.84375,
    z: -60.84375,
    regionIds: ['imperial-ngalinn'],
    updatedAt: '2026-09-01T00:00:00Z',
    systemFactions: [],
    systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    stations: [
      {
        id: 'st-1',
        systemId: 'sys-1',
        name: 'Hickam Survey',
        missionProviderFactions: { status: 'unknown' },
        updatedAt: '2026-09-01T00:00:00Z',
      },
    ],
  },
  {
    id: 'sys-2',
    name: 'Near System',
    x: 15,
    y: -220,
    z: -60,
    regionIds: ['imperial-ngalinn'],
    updatedAt: '2026-09-01T00:00:00Z',
    systemFactions: [],
    systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    stations: [],
  },
]

const REFRESHED_SYS_1: CachedSystem = {
  ...CHUNK_1[0],
  updatedAt: '2026-09-04T00:00:00Z',
  stations: [
    {
      id: 'st-1',
      systemId: 'sys-1',
      name: 'Hickam Survey Renamed',
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-04T00:00:00Z',
    },
    {
      id: 'st-2',
      systemId: 'sys-1',
      name: 'New Outpost',
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-04T00:00:00Z',
    },
  ],
}

const CHUNK_2: CachedSystem[] = [
  {
    id: 'sys-3',
    name: 'Far System',
    x: 5000,
    y: 0,
    z: 0,
    regionIds: ['imperial-ngalinn'],
    updatedAt: '2026-09-01T00:00:00Z',
    systemFactions: [],
    systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    stations: [],
  },
]

let fetchCalls: string[] = []
const originalFetch = global.fetch

function mockFetchOnce() {
  fetchCalls = []
  global.fetch = (async (input: string | URL) => {
    const url = String(input)
    fetchCalls.push(url)

    if (url.endsWith('/data/imperial/systems.json')) {
      return new Response(JSON.stringify(SYSTEMS_INDEX), { status: 200 })
    }
    if (url.endsWith('/data/imperial/chunks/chunk-001.json')) {
      return new Response(JSON.stringify(CHUNK_1), { status: 200 })
    }
    if (url.endsWith('/data/imperial/chunks/chunk-002.json')) {
      return new Response(JSON.stringify(CHUNK_2), { status: 200 })
    }
    if (url.includes('/api/galaxy/system?id=sys-1')) {
      return new Response(JSON.stringify({ status: 'ok', system: REFRESHED_SYS_1, warnings: [] }), {
        status: 200,
      })
    }
    if (url.includes('/api/galaxy/system?id=')) {
      return new Response(JSON.stringify({ status: 'error', message: 'no such system' }), {
        status: 404,
      })
    }

    return new Response('not found', { status: 404, statusText: 'Not Found' })
  }) as typeof fetch
}

beforeEach(() => {
  _resetGalaxyDataProviderCacheForTests()
  mockFetchOnce()
})

afterEach(() => {
  global.fetch = originalFetch
})

const NGALINN_COORDS = { x: 8.625, y: -219.84375, z: -60.84375 }

test('getSystemsInRadius фильтрует по радиусу от переданных координат', async () => {
  const result = await getSystemsInRadius('imperial', NGALINN_COORDS, 20)
  const ids = result.map((system) => system.id)
  assert.deepEqual(ids, ['sys-1', 'sys-2'])
})

test('getSystemsInRadius находит соседей, когда сам центр отсутствует в индексе (38.3)', async () => {
  const result = await getSystemsInRadius('imperial', { x: 10, y: -220, z: -60 }, 20)
  const ids = result.map((system) => system.id)
  assert.deepEqual(ids, ['sys-1', 'sys-2'])
})

test('getSystemsInRadius возвращает пустой список, когда рядом нет систем', async () => {
  const result = await getSystemsInRadius('imperial', { x: 100000, y: 0, z: 0 }, 20)
  assert.deepEqual(result, [])
})

test('resolveSystemCoords возвращает координаты по имени и null для системы вне индекса', async () => {
  assert.deepEqual(await resolveSystemCoords('imperial', 'Ngalinn'), NGALINN_COORDS)
  assert.equal(await resolveSystemCoords('imperial', 'Unknown System'), null)
})

test('getSystem подгружает нужный чанк и возвращает полную запись', async () => {
  const system = await getSystem('imperial', 'Ngalinn')
  assert.ok(system)
  assert.equal(system?.stations.length, 1)
  assert.equal(system?.stations[0].name, 'Hickam Survey')
})

test('getStations повторный вызов для того же региона не повторяет fetch чанка (кэш)', async () => {
  await getStations('imperial', NGALINN)
  await getStations('imperial', NGALINN)

  const chunkFetches = fetchCalls.filter((url) => url.endsWith('chunk-001.json'))
  assert.equal(chunkFetches.length, 1, 'чанк должен запрашиваться один раз, а не на каждый вызов')
})

test('getSystem для несуществующей системы возвращает null, а не бросает', async () => {
  const system = await getSystem('imperial', 'Nonexistent')
  assert.equal(system, null)
})

test('обновлённая система вытесняет свою копию из снимка везде, где её читают', async () => {
  await getStations('imperial', NGALINN)

  const result = await refreshSystem('sys-1')
  assert.equal(result.status, 'success')

  const stations = await getStations('imperial', NGALINN)
  assert.deepEqual(
    stations.map((station) => station.name),
    ['Hickam Survey Renamed', 'New Outpost'],
  )

  const system = await getSystem('imperial', 'Ngalinn')
  assert.equal(system?.updatedAt, '2026-09-04T00:00:00Z')

  const all = await getSystemsByIds('imperial', [{ id: 'sys-1', name: 'Ngalinn' }])
  const ngalinn = all.filter((entry: CachedSystem) => entry.id === 'sys-1')
  assert.equal(ngalinn.length, 1, 'система не должна попасть в список дважды')
  assert.equal(ngalinn[0].stations.length, 2)
})

test('getSystemsByIds читает только чанк нужной системы', async () => {
  const systems = await getSystemsByIds('imperial', [{ id: 'sys-1', name: 'Ngalinn' }])

  assert.deepEqual(
    systems.map((system: CachedSystem) => system.id),
    ['sys-1'],
  )
  assert.equal(fetchCalls.filter((url) => url.endsWith('chunk-002.json')).length, 0)
  assert.equal(fetchCalls.filter((url) => url.endsWith('chunk-001.json')).length, 1)
})

test('getSystemsByIds без известных id не трогает сеть', async () => {
  const systems = await getSystemsByIds('imperial', [])

  assert.deepEqual(systems, [])
  assert.equal(fetchCalls.length, 0)
})

test('getSystemsWithStationsInRadius не грузит чанки вне радиуса', async () => {
  const systems = await getSystemsWithStationsInRadius(
    'imperial',
    { x: 8.625, y: -219.84375, z: -60.84375 },
    40,
  )

  assert.deepEqual(systems.map((system: CachedSystem) => system.id).sort(), ['sys-1', 'sys-2'])
  assert.equal(fetchCalls.filter((url) => url.endsWith('chunk-002.json')).length, 0)
})

test('обновление не трогает соседние системы', async () => {
  await refreshSystem('sys-1')

  const near = await getSystem('imperial', 'Near System')
  assert.equal(near?.updatedAt, '2026-09-01T00:00:00Z')
})

test('неудачное обновление оставляет данные снимка на месте', async () => {
  const result = await refreshSystem('sys-404')
  assert.equal(result.status, 'not-found')

  const stations = await getStations('imperial', NGALINN)
  assert.deepEqual(
    stations.map((station) => station.name),
    ['Hickam Survey'],
  )
})

test('обновление не заставляет заново скачивать чанк', async () => {
  await getStations('imperial', NGALINN)
  await refreshSystem('sys-1')
  await getStations('imperial', NGALINN)

  const chunkFetches = fetchCalls.filter((url) => url.endsWith('chunk-001.json'))
  assert.equal(chunkFetches.length, 1)
})
