import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { useAccountSync, type AccountSyncPort } from '@/shared/lib/accountSync'

type Store = { local: string[]; remote: string[] }

function makePort(store: Store, overrides: Partial<AccountSyncPort<string[]>> = {}) {
  const calls = { fetched: 0, saved: [] as string[][], forgotten: [] as string[][] }
  let listener: (() => void) | null = null
  let forgetListener: ((ids: readonly string[]) => void) | null = null

  const port: AccountSyncPort<string[]> = {
    fetchRemote: async () => {
      calls.fetched += 1
      return { status: 'success', items: store.remote }
    },
    saveRemote: async (items) => {
      calls.saved.push([...items])
      store.remote = [...items]
      return store.remote
    },
    forgetRemote: async (ids) => {
      calls.forgotten.push([...ids])
      store.remote = store.remote.filter((item) => !ids.includes(item))
      return store.remote
    },
    readLocal: () => store.local,
    writeLocal: (items) => {
      store.local = items
    },
    subscribeLocal: (next) => {
      listener = next
      return () => {
        listener = null
      }
    },
    subscribeForgotten: (next) => {
      forgetListener = next
      return () => {
        forgetListener = null
      }
    },
    merge: (local, remote) => [...new Set([...local, ...remote])].sort(),
    same: (left, right) => left.join() === right.join(),
    ...overrides,
  }

  return {
    port,
    calls,
    change: () => listener?.(),
    forget: (ids: string[]) => forgetListener?.(ids),
  }
}

function Probe({ isSignedIn, port }: { isSignedIn: boolean; port: AccountSyncPort<string[]> }) {
  useAccountSync(isSignedIn, port)
  return null
}

test('гость на сервер не ходит вовсе (45.6)', async () => {
  const store: Store = { local: ['a'], remote: ['b'] }
  const { port, calls } = makePort(store)

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: false, port }))
  await view.settle()

  assert.equal(calls.fetched, 0)
  assert.deepEqual(store.local, ['a'], 'локальное не трогаем')
  view.unmount()
})

test('ответ сервера объединяется с местным, а не побеждает его', async () => {
  const store: Store = { local: ['местное'], remote: ['серверное'] }
  const { port } = makePort(store)

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  await view.settle()

  assert.deepEqual(store.local, ['местное', 'серверное'])
  view.unmount()
})

test('объединённое уезжает обратно — но только если разошлось', async () => {
  const store: Store = { local: ['местное'], remote: ['серверное'] }
  const { port, calls } = makePort(store)

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  await view.settle()

  assert.deepEqual(calls.saved, [['местное', 'серверное']])
  view.unmount()
})

test('копия, совпавшая с сервером, обратно не отправляется', async () => {
  const store: Store = { local: ['одно'], remote: ['одно'] }
  const { port, calls } = makePort(store)

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  await view.settle()

  assert.deepEqual(calls.saved, [])
  view.unmount()
})

test('удаление уходит своим запросом, а не отсутствием записи', async () => {
  const store: Store = { local: ['a', 'b'], remote: ['a', 'b'] }
  const { port, calls, forget } = makePort(store)

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  await view.settle()

  forget(['a'])
  await view.settle()

  assert.deepEqual(calls.forgotten, [['a']])
  assert.deepEqual(store.remote, ['b'])
  view.unmount()
})

test('до ответа сервера своё не отправляется', async () => {
  const held: { release: (() => void) | null } = { release: null }
  const store: Store = { local: ['местное'], remote: ['серверное'] }
  const { port, calls, change } = makePort(store, {
    fetchRemote: () =>
      new Promise((resolve) => {
        held.release = () => resolve({ status: 'success', items: store.remote })
      }),
  })

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  change()
  await view.settle()

  assert.deepEqual(calls.saved, [], 'ответа ещё нет — молчим')

  held.release?.()
  await view.settle()

  assert.deepEqual(calls.saved, [['местное', 'серверное']])
  view.unmount()
})

test('сервер молчит — работаем как гость, ничего не теряя', async () => {
  const store: Store = { local: ['местное'], remote: [] }
  const { port, calls } = makePort(store, {
    fetchRemote: async () => ({ status: 'unavailable' }),
  })

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  await view.settle()

  assert.deepEqual(store.local, ['местное'])
  assert.deepEqual(calls.saved, [])
  view.unmount()
})

test('правка после загрузки уезжает с задержкой, а не сразу', async () => {
  const store: Store = { local: ['одно'], remote: ['одно'] }
  const { port, calls, change } = makePort(store)

  const view = await renderInDom(React.createElement(Probe, { isSignedIn: true, port }))
  await view.settle()
  assert.deepEqual(calls.saved, [], 'при совпавших копиях первого сохранения нет')

  store.local = ['одно', 'два']
  change()
  await view.settle()
  assert.deepEqual(calls.saved, [], 'сразу не отправляем')

  await new Promise((resolve) => setTimeout(resolve, 900))
  await view.settle()

  assert.deepEqual(calls.saved, [['одно', 'два']])
  view.unmount()
})
