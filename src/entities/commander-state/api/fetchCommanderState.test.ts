import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { fetchCommanderState } from '@/entities/commander-state/api/fetchCommanderState'

const realFetch = globalThis.fetch

function stubFetch(status: number, body: unknown): void {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof globalThis.fetch
}

afterEach(() => {
  globalThis.fetch = realFetch
})

test('состояния нет и агент не запускался — просим запустить', () => {
  stubFetch(404, { status: 'error', message: 'No commander state stored yet.' })

  return fetchCommanderState().then((result) => {
    assert.equal(result.status, 'not-found')
    assert.equal(result.agentUpdateRequired, false)
    assert.match(result.message, /has not sent any state/)
  })
})

test('состояния нет, потому что сборку уже не принимают — просим обновить (69.5)', () => {
  stubFetch(404, {
    status: 'error',
    message: 'No commander state stored yet.',
    agentUpdateRequired: true,
    rejectedSchemaVersion: 3,
  })

  return fetchCommanderState().then((result) => {
    assert.equal(result.status, 'not-found')
    assert.equal(result.agentUpdateRequired, true)
    assert.match(result.message, /build is too old/)
  })
})

test('404 без тела не ломает чтение', () => {
  globalThis.fetch = (async () => new Response('', { status: 404 })) as typeof globalThis.fetch

  return fetchCommanderState().then((result) => {
    assert.equal(result.status, 'not-found')
    assert.equal(result.agentUpdateRequired, false)
  })
})
