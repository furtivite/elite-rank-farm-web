import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  getStarLayerNear,
  _resetStarLayerCacheForTests,
} from '@/entities/galaxy-data/api/fetchStarLayer'

const META = { schemaVersion: 1, regionId: 'galaxy', cellLy: 50, count: 2 }

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

beforeEach(() => {
  _resetStarLayerCacheForTests()
})

test('нарезанный слой берётся ячейками вокруг точки', async () => {
  const stub = stubFetch({
    'stars/galaxy/meta.json': META,
    'stars/galaxy/cells/cell_0_0_0.json': [['1', 1, 1, 1]],
    'stars/galaxy/cells/cell_-1_-1_-1.json': [['2', -1, -1, -1]],
  })

  try {
    const layer = await getStarLayerNear('galaxy', { x: 0, y: 0, z: 0 }, 10)

    assert.deepEqual(
      layer.systems.map((entry) => entry[0]).sort(),
      ['1', '2'],
      'звёзды обеих задетых ячеек',
    )
    assert.ok(!stub.asked.some((url) => url.endsWith('stars/galaxy.json')))
    assert.equal(stub.asked.filter((url) => url.includes('/cells/cell_')).length, 8)
  } finally {
    stub.restore()
  }
})

test('пустая ячейка не ломает слой, а просто ничего не приносит', async () => {
  const stub = stubFetch({
    'stars/galaxy/meta.json': META,
    'stars/galaxy/cells/cell_0_0_0.json': [['1', 1, 1, 1]],
  })

  try {
    const layer = await getStarLayerNear('galaxy', { x: 0, y: 0, z: 0 }, 10)
    assert.equal(layer.count, 1)
  } finally {
    stub.restore()
  }
})

test('слой прежней раскладки читается одним файлом, как раньше', async () => {
  const whole = {
    regionId: 'imperial-ngalinn',
    radiusLy: 100,
    count: 1,
    systems: [['7', 0, 0, 0]],
  }
  const stub = stubFetch({ 'stars/imperial.json': whole })

  try {
    const layer = await getStarLayerNear('imperial', { x: 0, y: 0, z: 0 }, 10)

    assert.equal(layer.count, 1)
    assert.ok(!stub.asked.some((url) => url.includes('/cells/')))
  } finally {
    stub.restore()
  }
})
