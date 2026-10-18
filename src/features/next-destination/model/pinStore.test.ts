import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

type Store = { store: Record<string, string>; throwOnGet?: boolean }

const state: Store = { store: {} }

function installLocalStorage(): void {
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => {
      if (state.throwOnGet) {
        throw new Error('storage disabled')
      }
      return state.store[key] ?? null
    },
    setItem: (key: string, value: string) => {
      state.store[key] = value
    },
    removeItem: (key: string) => {
      delete state.store[key]
    },
  }
  ;(globalThis as { window?: unknown }).window = globalThis
}

beforeEach(() => {
  state.store = {}
  state.throwOnGet = false
  installLocalStorage()
})

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage
  delete (globalThis as { window?: unknown }).window
})

async function freshStore() {
  const module = await import('@/features/next-destination/model/pinStore')
  module._resetPinStoreForTests()
  return module
}

test('пустое хранилище — закрепления нет', async () => {
  const { getPinSnapshot } = await freshStore()
  assert.equal(getPinSnapshot(), null)
})

test('корректное значение читается', async () => {
  state.store['elite:next-destination-pin'] = JSON.stringify({
    systemKey: 'sys',
    stationKey: 'st',
  })

  const { getPinSnapshot } = await freshStore()
  assert.deepEqual(getPinSnapshot(), { systemKey: 'sys', stationKey: 'st' })
})

test('мусор в хранилище не роняет страницу', async () => {
  for (const garbage of ['не json', '42', '"строка"', '{}', '{"stationKey":"st"}', 'null']) {
    state.store['elite:next-destination-pin'] = garbage
    const { getPinSnapshot } = await freshStore()
    assert.equal(getPinSnapshot(), null, `значение ${garbage} должно игнорироваться`)
  }
})

test('закрепление системы целиком — станция null, а не отсутствует', async () => {
  state.store['elite:next-destination-pin'] = JSON.stringify({ systemKey: 'sys' })

  const { getPinSnapshot } = await freshStore()
  assert.deepEqual(getPinSnapshot(), { systemKey: 'sys', stationKey: null })
})

test('недоступное хранилище не мешает работать', async () => {
  state.throwOnGet = true

  const { getPinSnapshot } = await freshStore()
  assert.equal(getPinSnapshot(), null)
})
