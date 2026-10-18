import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { fetchSystemSnapshot } from '@/entities/galaxy-data/api/fetchSystemSnapshot'

const originalFetch = global.fetch

const SYSTEM = {
  id: 'sys-1',
  name: 'Ngalinn',
  x: 1,
  y: 2,
  z: 3,
  regionIds: ['imperial-ngalinn'],
  updatedAt: '2026-09-04T00:00:00Z',
  systemFactions: [],
  systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
  stations: [],
}

let lastUrl = ''

function respondWith(body: unknown, status = 200): void {
  global.fetch = (async (input: string | URL) => {
    lastUrl = String(input)
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
  }) as typeof fetch
}

afterEach(() => {
  global.fetch = originalFetch
})

test('успешный ответ разбирается в систему', async () => {
  respondWith({ status: 'ok', system: SYSTEM, warnings: [] })

  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'success')
  assert.equal(result.status === 'success' ? result.system.name : null, 'Ngalinn')
})

test('id уходит в запрос экранированным', async () => {
  respondWith({ status: 'ok', system: SYSTEM, warnings: [] })
  await fetchSystemSnapshot('sys 1&x=2')

  assert.match(lastUrl, /\/api\/galaxy\/system\?id=sys%201%26x%3D2$/)
})

test('незалогиненному говорится про вход, а не «ошибка сервера»', async () => {
  respondWith({ status: 'error' }, 401)
  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'unauthorized')
  assert.match(result.status === 'unauthorized' ? result.message : '', /Sign in/)
})

test('404 — расхождение снимка с базой, а не «данные устарели»', async () => {
  respondWith({ status: 'error' }, 404)
  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'not-found')
})

test('прочий код сервера называется числом', async () => {
  respondWith({ status: 'error' }, 500)
  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'error')
  assert.match(result.status === 'error' ? result.message : '', /500/)
})

test('ответ не в JSON не роняет обновление', async () => {
  respondWith('<!doctype html>', 200)
  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'error')
})

test('JSON не той формы отвергается разбором, а не доезжает до кэша', async () => {
  respondWith({ status: 'ok', system: { id: 'sys-1' } })
  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'error')
})

test('оборванная сеть — ошибка с текстом, а не исключение наружу', async () => {
  global.fetch = (async () => {
    throw new Error('network down')
  }) as typeof fetch

  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'error')
  assert.match(result.status === 'error' ? result.message : '', /network down/)
})

test('ответ про другую систему не попадает в кэш', async () => {
  respondWith({ status: 'ok', system: { ...SYSTEM, id: 'sys-2' } })
  const result = await fetchSystemSnapshot('sys-1')

  assert.equal(result.status, 'error')
  assert.match(result.status === 'error' ? result.message : '', /a different system/)
})
