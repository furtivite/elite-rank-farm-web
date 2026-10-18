import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PROGRESSIVE_PAGE_SIZE_SYSTEMS } from '@/shared/lib/progressiveList'
import { searchFarmCandidates } from '@/features/farm-recommender/lib/searchFarmCandidates'

test('порция систем — та же, что показывает выдача', () => {
  assert.equal(PROGRESSIVE_PAGE_SIZE_SYSTEMS, 25)
})

const META = {
  schemaVersion: 1,
  generatedAt: '2026-09-08T15:00:00Z',
  regionId: 'galaxy',
  centerSystem: 'Sol',
  radiusLy: 50000,
  systems: 1,
  stations: 1,
  chunkCount: 1,
  possiblyTruncated: false,
  indexCellLy: 50,
}

const SOL_ENTRY = {
  id: '10477373803',
  name: 'Sol',
  x: 0,
  y: 0,
  z: 0,
  chunk: 'chunks/chunk_0_0_0.json',
  stations: 1,
  missionBoards: 1,
  largePad: true,
}

const SOL_FULL = {
  id: SOL_ENTRY.id,
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
      systemId: SOL_ENTRY.id,
      name: 'Abraham Lincoln',
      hasMissionBoard: true,
      maxPadSize: 'L',
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-08T00:00:00Z',
    },
  ],
}

test('поиск на нарезанном снимке не качает ни индекс целиком, ни словарь имён', async () => {
  const files: Record<string, unknown> = {
    'galaxy/meta.json': META,
    'galaxy/index/index_0_0_0.json': [SOL_ENTRY],
    'galaxy/chunks/chunk_0_0_0.json': [SOL_FULL],
  }

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

  try {
    const { _resetGalaxyDataProviderCacheForTests } =
      await import('@/entities/galaxy-data/api/galaxyDataProvider')
    _resetGalaxyDataProviderCacheForTests()

    const groups = await searchFarmCandidates({
      mode: 'empire',
      currentSystem: { kind: 'coords', name: 'Sol', x: 0, y: 0, z: 0 },
      jumpRangeLy: 10,
    })

    assert.deepEqual(
      groups.map((group) => group.systemName),
      ['Sol'],
    )
    assert.ok(!asked.some((url) => url.endsWith('galaxy/systems.json')), 'индекс целиком')
    assert.ok(!asked.some((url) => url.endsWith('galaxy/names.json')), 'словарь имён')
  } finally {
    globalThis.fetch = original
  }
})

async function searchWith(stations: readonly Record<string, unknown>[]) {
  const files: Record<string, unknown> = {
    'galaxy/meta.json': META,
    'galaxy/index/index_0_0_0.json': [SOL_ENTRY],
    'galaxy/chunks/chunk_0_0_0.json': [{ ...SOL_FULL, stations }],
  }

  const original = globalThis.fetch
  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input)
    const key = Object.keys(files).find((suffix) => url.endsWith(suffix))
    return key === undefined
      ? new Response('not found', { status: 404 })
      : new Response(JSON.stringify(files[key]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
  }) as typeof fetch

  try {
    const { _resetGalaxyDataProviderCacheForTests } =
      await import('@/entities/galaxy-data/api/galaxyDataProvider')
    _resetGalaxyDataProviderCacheForTests()

    return await searchFarmCandidates({
      mode: 'empire',
      currentSystem: { kind: 'coords', name: 'Sol', x: 0, y: 0, z: 0 },
      jumpRangeLy: 10,
    })
  } finally {
    globalThis.fetch = original
  }
}

const NO_BOARD = {
  id: 'st-no-board',
  systemId: SOL_ENTRY.id,
  name: 'Black Landing',
  hasMissionBoard: false,
  maxPadSize: 'M',
  missionProviderFactions: { status: 'unknown' },
  updatedAt: '2026-09-08T00:00:00Z',
}

test('слово дампа станцию не прячет — «доска под вопросом» (116.5)', async () => {
  const fromDump = await searchWith([
    ...SOL_FULL.stations,
    { ...NO_BOARD, missionBoardSource: 'builder' },
  ])

  assert.equal(fromDump[0]?.stations.length, 2, 'станция осталась в выдаче')
  assert.equal(fromDump[0]?.hiddenNoBoard, 0, 'скрытых нет')
})

test('слово игры станцию прячет: командир проверил собой (116.5)', async () => {
  const fromGame = await searchWith([
    ...SOL_FULL.stations,
    { ...NO_BOARD, missionBoardSource: 'journal' },
  ])

  assert.equal(fromGame[0]?.stations.length, 1, 'станция скрыта')
  assert.equal(fromGame[0]?.hiddenNoBoard, 1, 'и посчитана')
})

test('источника нет — считаем словом дампа (116.5)', async () => {
  const noSource = await searchWith([...SOL_FULL.stations, NO_BOARD])

  assert.equal(noSource[0]?.stations.length, 2, 'станция остаётся в выдаче')
})

test('станции без доски заданий не исчезают молча — их считают (116.4)', async () => {
  const withoutBoard = {
    ...SOL_FULL,
    stations: [...SOL_FULL.stations, { ...NO_BOARD, missionBoardSource: 'journal' }],
  }

  const files: Record<string, unknown> = {
    'galaxy/meta.json': META,
    'galaxy/index/index_0_0_0.json': [SOL_ENTRY],
    'galaxy/chunks/chunk_0_0_0.json': [withoutBoard],
  }

  const original = globalThis.fetch
  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input)
    const key = Object.keys(files).find((suffix) => url.endsWith(suffix))
    return key === undefined
      ? new Response('not found', { status: 404 })
      : new Response(JSON.stringify(files[key]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
  }) as typeof fetch

  try {
    const { _resetGalaxyDataProviderCacheForTests } =
      await import('@/entities/galaxy-data/api/galaxyDataProvider')
    _resetGalaxyDataProviderCacheForTests()

    const groups = await searchFarmCandidates({
      mode: 'empire',
      currentSystem: { kind: 'coords', name: 'Sol', x: 0, y: 0, z: 0 },
      jumpRangeLy: 10,
    })

    assert.equal(groups[0]?.stations.length, 1, 'станция без доски в выдачу не идёт')
    assert.equal(groups[0]?.hiddenNoBoard, 1, 'но она посчитана')
  } finally {
    globalThis.fetch = original
  }
})
