import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { getClustersNear, getSystemsInRadius, resolveSystemCoords } from '@/entities/galaxy-data'
import { _resetGalaxyDataProviderCacheForTests } from '@/entities/galaxy-data/api/galaxyDataProvider'

beforeEach(() => {
  _resetGalaxyDataProviderCacheForTests()
})

const META = {
  schemaVersion: 1,
  generatedAt: '2026-09-08T15:00:00Z',
  regionId: 'galaxy',
  centerSystem: 'Sol',
  radiusLy: 50000,
  systems: 2,
  stations: 1,
  chunkCount: 1,
  possiblyTruncated: false,
  indexCellLy: 50,
  clusterRadiusLy: 15,
  clusterNearStarLs: 500,
}

const SOL = {
  id: '10477373803',
  name: 'Sol',
  x: 0,
  y: 0,
  z: 0,
  chunk: 'chunks/chunk_0_0_0.json',
  stations: 67,
}

function stubFetch(files: Record<string, unknown>) {
  const asked: string[] = []
  const original = globalThis.fetch

  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input)
    asked.push(url)
    const key = Object.keys(files).find((suffix) => url.endsWith(suffix))

    return key === undefined
      ? new Response('not found', { status: 404 })
      : new Response(JSON.stringify(files[key]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
  }) as typeof fetch

  return {
    asked,
    restore: () => {
      globalThis.fetch = original
    },
  }
}

test('поиск в радиусе берёт ячейки, а не индекс целиком', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/index/index_0_0_0.json': [SOL],
  })

  try {
    const found = await getSystemsInRadius('galaxy', { x: 0, y: 0, z: 0 }, 10)

    assert.equal(found.length, 1)
    assert.equal(found[0].name, 'Sol')
    assert.ok(!stub.asked.some((url) => url.endsWith('galaxy/systems.json')))
    const cells = stub.asked.filter((url) => url.includes('/index/index_'))
    assert.equal(cells.length, 8)
  } finally {
    stub.restore()
  }
})

test('имя системы разрешается через словарь, а не перебором индекса', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/names.json': { Sol: [0, 0, 0] },
    'galaxy/index/index_0_0_0.json': [SOL],
  })

  try {
    const coords = await resolveSystemCoords('galaxy', 'Sol')

    assert.deepEqual(coords, { x: 0, y: 0, z: 0 })
    assert.ok(!stub.asked.some((url) => url.endsWith('galaxy/systems.json')))
  } finally {
    stub.restore()
  }
})

test('кластеры берутся окрестностью, а общий файл не скачивается', async () => {
  const candidate = { systemName: 'Sol', x: 0, y: 0, z: 0, byFilter: {} }
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/clusters/clusters_0_0_0.json': [candidate],
  })

  try {
    const clusters = await getClustersNear('galaxy', { x: 0, y: 0, z: 0 }, 10)

    assert.equal(clusters.candidates.length, 1)
    assert.equal(clusters.radiusLy, 15)
    assert.equal(clusters.nearStarLs, 500)
    assert.ok(!stub.asked.some((url) => url.endsWith('galaxy/clusters.json')))
  } finally {
    stub.restore()
  }
})

test('обход всего региона на нарезанном снимке запрещён', async () => {
  const stub = stubFetch({ 'galaxy/meta.json': META })

  try {
    const { getRegionSystemsForLegacyLookup } = await import('@/entities/galaxy-data')
    const systems = await getRegionSystemsForLegacyLookup('galaxy')

    assert.deepEqual(systems, [])
    assert.ok(!stub.asked.some((url) => url.includes('/chunks/')))
  } finally {
    stub.restore()
  }
})

test('координаты целей корзины берутся по имени и ячейке', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/names.json': { Sol: [0, 0, 0] },
    'galaxy/index/index_0_0_0.json': [SOL],
  })

  try {
    const { getSystemCoordsByIds } = await import('@/entities/galaxy-data')
    const coords = await getSystemCoordsByIds('galaxy', [{ id: SOL.id, name: 'Sol' }])

    assert.deepEqual(coords.get(SOL.id), { x: 0, y: 0, z: 0 })
    assert.ok(!stub.asked.some((url) => url.endsWith('galaxy/systems.json')))
  } finally {
    stub.restore()
  }
})

test('цель, которой нет в словаре, просто остаётся без координат', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/names.json': { Sol: [0, 0, 0] },
  })

  try {
    const { getSystemCoordsByIds } = await import('@/entities/galaxy-data')
    const coords = await getSystemCoordsByIds('galaxy', [{ id: '1', name: 'Ниоткуда' }])

    assert.equal(coords.size, 0)
  } finally {
    stub.restore()
  }
})

test('станции системы берутся по имени и ячейке, а не перебором индекса', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/names.json': { Sol: [0, 0, 0] },
    'galaxy/index/index_0_0_0.json': [SOL],
    'galaxy/chunks/chunk_0_0_0.json': [
      {
        id: SOL.id,
        name: 'Sol',
        x: 0,
        y: 0,
        z: 0,
        regionIds: ['galaxy'],
        updatedAt: '2026-09-08T00:00:00Z',
        systemFactions: [],
        systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
        stations: [
          {
            id: 'st-abraham',
            systemId: SOL.id,
            name: 'Abraham Lincoln',
            missionProviderFactions: { status: 'unknown' },
            updatedAt: '2026-09-08T00:00:00Z',
          },
        ],
      },
    ],
  })

  try {
    const { getStations } = await import('@/entities/galaxy-data')
    const stations = await getStations('galaxy', { id: SOL.id, name: 'Sol' })

    assert.deepEqual(
      stations.map((station) => station.name),
      ['Abraham Lincoln'],
    )
    assert.ok(!stub.asked.some((url) => url.endsWith('galaxy/systems.json')))
  } finally {
    stub.restore()
  }
})

test('подсказки по имени ищут в словаре, а не в индексе целиком', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/names.json': { Sol: [0, 0, 0], Solati: [0, 0, 0], 'Beta Sculptoris': [0, 0, 0] },
    'galaxy/index/index_0_0_0.json': [SOL, { ...SOL, id: '2', name: 'Solati' }],
  })

  try {
    const { searchSystemsByName } = await import('@/entities/galaxy-data')
    const found = await searchSystemsByName('galaxy', 'sol')

    assert.deepEqual(
      found.map((entry) => entry.name),
      ['Sol', 'Solati'],
    )
    assert.ok(!stub.asked.some((url) => url.endsWith('galaxy/systems.json')))
  } finally {
    stub.restore()
  }
})

test('подсказка находится и по середине имени, но после совпадений с начала', async () => {
  const stub = stubFetch({
    'galaxy/meta.json': META,
    'galaxy/names.json': { 'Beta Sculptoris': [0, 0, 0], Sculptor: [0, 0, 0] },
    'galaxy/index/index_0_0_0.json': [
      { ...SOL, id: '3', name: 'Beta Sculptoris' },
      { ...SOL, id: '4', name: 'Sculptor' },
    ],
  })

  try {
    const { searchSystemsByName } = await import('@/entities/galaxy-data')
    const found = await searchSystemsByName('galaxy', 'sculpt')

    assert.deepEqual(
      found.map((entry) => entry.name),
      ['Sculptor', 'Beta Sculptoris'],
    )
  } finally {
    stub.restore()
  }
})
