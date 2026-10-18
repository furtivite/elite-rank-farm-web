import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { _resetGalaxyDataProviderCacheForTests } from '@/entities/galaxy-data/api/galaxyDataProvider'
import {
  refreshTargets,
  _resetRefreshedTargetsForTests,
} from '@/entities/mission-store/lib/refreshTargets'

const originalFetch = global.fetch

function system(id: string, station: string): Record<string, unknown> {
  return {
    id,
    name: `System ${id}`,
    x: 0,
    y: 0,
    z: 0,
    regionIds: ['imperial-ngalinn'],
    updatedAt: '2026-09-19T00:00:00Z',
    systemFactions: [],
    systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    stations: [
      {
        id: `${id}-st`,
        name: station,
        systemId: id,
        updatedAt: '2026-09-19T00:00:00Z',
        distanceToArrivalLs: 100,
        maxPadSize: 'L',
        hasMissionBoard: true,
      },
    ],
  }
}

let asked: string[] = []

function answerWith(status: (id: string) => number): void {
  asked = []
  global.fetch = (async (input: string | URL) => {
    const url = String(input)
    const id = new URL(url, 'https://example.test').searchParams.get('id') ?? ''
    asked.push(id)

    const code = status(id)
    if (code !== 200) {
      return new Response(JSON.stringify({ status: 'error' }), { status: code })
    }

    return new Response(JSON.stringify({ status: 'ok', system: system(id, 'Fresh Port') }), {
      status: 200,
    })
  }) as typeof fetch
}

let waited: number[] = []
const wait = async (ms: number): Promise<void> => {
  waited.push(ms)
}

beforeEach(() => {
  _resetRefreshedTargetsForTests()
  _resetGalaxyDataProviderCacheForTests()
  waited = []
})

afterEach(() => {
  global.fetch = originalFetch
})

test('цели спрашиваются по очереди с паузой, а не пачкой', async () => {
  answerWith(() => 200)
  const fresh: string[] = []

  await refreshTargets(['s1', 's2', 's3'], {
    cancelled: () => false,
    onFresh: (fresher) => fresh.push(fresher.id),
    wait,
  })

  assert.deepEqual(asked, ['s1', 's2', 's3'])
  assert.deepEqual(fresh, ['s1', 's2', 's3'])
  assert.equal(waited.length, 2)
  assert.ok(
    waited.every((ms) => ms >= 1000),
    `пауза короче серверного лимита: ${waited.join(', ')}`,
  )
})

test('уже освежённую систему повторно не спрашивают', async () => {
  answerWith(() => 200)

  await refreshTargets(['s1'], { cancelled: () => false, onFresh: () => {}, wait })
  await refreshTargets(['s1'], { cancelled: () => false, onFresh: () => {}, wait })

  assert.deepEqual(asked, ['s1'])
})

test('память о свежести истекает', async () => {
  answerWith(() => 200)
  let clock = 1_000_000

  await refreshTargets(['s1'], {
    cancelled: () => false,
    onFresh: () => {},
    wait,
    now: () => clock,
  })
  clock += 5 * 60 * 1000
  await refreshTargets(['s1'], {
    cancelled: () => false,
    onFresh: () => {},
    wait,
    now: () => clock,
  })

  assert.deepEqual(asked, ['s1', 's1'])
})

test('401 прекращает обход целиком', async () => {
  answerWith(() => 401)

  await refreshTargets(['s1', 's2', 's3'], {
    cancelled: () => false,
    onFresh: () => {},
    wait,
  })

  assert.deepEqual(asked, ['s1'])
})

test('отказ не считается освежением и повторяется в следующий заход', async () => {
  answerWith(() => 429)
  await refreshTargets(['s1'], { cancelled: () => false, onFresh: () => {}, wait })

  answerWith(() => 200)
  const fresh: string[] = []
  await refreshTargets(['s1'], {
    cancelled: () => false,
    onFresh: (fresher) => fresh.push(fresher.id),
    wait,
  })

  assert.deepEqual(fresh, ['s1'])
})

test('отмена останавливает обход, и ответ никого не трогает', async () => {
  answerWith(() => 200)
  let stop = false
  const fresh: string[] = []

  await refreshTargets(['s1', 's2', 's3'], {
    cancelled: () => stop,
    onFresh: (fresher) => {
      fresh.push(fresher.id)
      stop = true
    },
    wait,
  })

  assert.deepEqual(asked, ['s1'])
  assert.deepEqual(fresh, ['s1'])
})
