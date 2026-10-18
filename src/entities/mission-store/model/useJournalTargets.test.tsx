import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { renderInDom } from '@/shared/test/renderInDom'
import { _resetGalaxyDataProviderCacheForTests } from '@/entities/galaxy-data/api/galaxyDataProvider'
import { _resetRefreshedTargetsForTests } from '@/entities/mission-store/lib/refreshTargets'
import { useJournalTargets } from '@/entities/mission-store/model/useJournalTargets'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'

const SNAPSHOT_SYSTEM = {
  id: '100',
  name: 'Ngalinn',
  x: 0,
  y: 0,
  z: 0,
  regionIds: ['imperial-ngalinn'],
  updatedAt: '2026-09-19T00:00:00Z',
  systemFactions: [],
  systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
  stations: [],
}

const FRESH_SYSTEM = {
  ...SNAPSHOT_SYSTEM,
  stations: [
    {
      id: '100-1',
      systemId: '100',
      name: 'Hammel Terminal',
      updatedAt: '2026-09-19T12:00:00Z',
    },
  ],
}

const INDEX = [{ id: '100', name: 'Ngalinn', x: 0, y: 0, z: 0, chunk: 'chunks/c1.json' }]

const MISSIONS: JournalMission[] = [
  {
    missionId: '1',
    name: 'Mission_Delivery',
    destinationSystem: 'Ngalinn',
    destinationStation: 'Hammel Terminal',
    acceptedAt: '2026-09-19T11:00:00Z',
    detailsKnown: true,
  },
]

const realFetch = globalThis.fetch
let refreshed = 0

function refuseRefresh(): void {
  const withRefresh = globalThis.fetch
  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input)
    if (url.includes('/api/galaxy/system?id=')) {
      refreshed += 1
      return new Response(JSON.stringify({ status: 'error' }), { status: 401 })
    }
    return withRefresh(input)
  }) as typeof fetch
}

function mockFetch(): void {
  refreshed = 0
  globalThis.fetch = (async (input: string | URL) => {
    const url = String(input)

    if (url.includes('/api/galaxy/system?id=')) {
      refreshed += 1
      return new Response(JSON.stringify({ status: 'ok', system: FRESH_SYSTEM, warnings: [] }), {
        status: 200,
      })
    }
    if (url.endsWith('/data/imperial/meta.json')) {
      return new Response(JSON.stringify({ schemaVersion: 1, regionId: 'imperial-ngalinn' }), {
        status: 200,
      })
    }
    if (url.endsWith('/data/imperial/systems.json')) {
      return new Response(JSON.stringify(INDEX), { status: 200 })
    }
    if (url.endsWith('/data/imperial/chunks/c1.json')) {
      return new Response(JSON.stringify([SNAPSHOT_SYSTEM]), { status: 200 })
    }

    return new Response('not found', { status: 404 })
  }) as typeof fetch
}

let seen: { stations: number; revision: number }[] = []

function Probe(): null {
  const targets = useJournalTargets('imperial', MISSIONS)
  seen.push({
    stations: targets.byName.get('Ngalinn')?.stations.size ?? -1,
    revision: targets.revision,
  })
  return null
}

beforeEach(() => {
  seen = []
  _resetGalaxyDataProviderCacheForTests()
  _resetRefreshedTargetsForTests()
  mockFetch()
})

afterEach(() => {
  globalThis.fetch = realFetch
})

test('станция, которой нет в снимке, доезжает без перезагрузки', async () => {
  const dom = await renderInDom(<Probe />)
  await dom.settle()
  await dom.settle()
  dom.unmount()

  assert.equal(refreshed, 1, 'цель не дозапрашивалась у сервера')

  const last = seen.at(-1)
  assert.equal(last?.stations, 1, `станция не доехала: ${JSON.stringify(seen)}`)
  assert.ok(last !== undefined && last.revision > 0, 'номер правки не вырос')
})

test('без ответа сервера остаётся то, что знает снимок', async () => {
  refuseRefresh()

  const dom = await renderInDom(<Probe />)
  await dom.settle()
  await dom.settle()
  dom.unmount()

  const last = seen.at(-1)
  assert.equal(last?.stations, 0, `снимок подменился: ${JSON.stringify(seen)}`)
  assert.equal(last?.revision, 0, 'номер правки вырос без успешного ответа')
})
