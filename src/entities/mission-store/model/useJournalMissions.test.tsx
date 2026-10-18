import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { useJournalMissions } from '@/entities/mission-store/model/useJournalMissions'
import {
  _resetJournalMissionsPollForTests,
  shouldReadJournal,
  UNDOCKED_EVERY_TICKS,
} from '@/entities/mission-store/model/journalMissionsPoll'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'

let requests = 0
let timers = 0
let tick: (() => void) | null = null
const realFetch = globalThis.fetch
const realSetInterval = window.setInterval

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

function Probe({ mocked }: { mocked: JournalMission[] | null }) {
  useJournalMissions(mocked)
  return null
}

function tickUntilUndockedRead(): void {
  for (let step = 0; step < UNDOCKED_EVERY_TICKS; step += 1) {
    tick?.()
  }
}

beforeEach(() => {
  _resetJournalMissionsPollForTests()
  requests = 0
  timers = 0
  tick = null
  setVisibility('visible')
  globalThis.fetch = (async () => {
    requests += 1
    return new Response(JSON.stringify({ missions: [] }), { status: 200 })
  }) as typeof fetch
  window.setInterval = ((callback: () => void) => {
    timers += 1
    tick = callback
    return 1
  }) as unknown as typeof window.setInterval
})

afterEach(() => {
  globalThis.fetch = realFetch
  window.setInterval = realSetInterval
})

test('в доке задания читаются на каждом шаге — их там берут и сдают', () => {
  for (let step = 1; step <= 5; step += 1) {
    assert.equal(shouldReadJournal(step, true), true)
  }
})

test('вне дока — раз в пять минут, а не каждые пять секунд', () => {
  const reads = Array.from({ length: 120 }, (_, index) => shouldReadJournal(index + 1, false))

  assert.equal(reads.filter(Boolean).length, 2)
  assert.equal(shouldReadJournal(UNDOCKED_EVERY_TICKS, false), true)
})

test('по таймеру задания перечитываются', async () => {
  const view = await renderInDom(React.createElement(Probe, { mocked: null }))
  assert.equal(requests, 1)

  tickUntilUndockedRead()
  await view.settle()
  assert.equal(requests, 2)
  view.unmount()
})

test('панель и корзина делят один опрос, а не заводят по своему (84)', async () => {
  const view = await renderInDom(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Probe, { mocked: null }),
      React.createElement(Probe, { mocked: null }),
    ),
  )
  assert.equal(timers, 1)
  assert.equal(requests, 1)

  tickUntilUndockedRead()
  await view.settle()
  assert.equal(requests, 2)
  view.unmount()
})

test('на скрытой вкладке таймер в сеть не ходит', async () => {
  const view = await renderInDom(React.createElement(Probe, { mocked: null }))
  setVisibility('hidden')

  tickUntilUndockedRead()
  await view.settle()
  assert.equal(requests, 1)
  view.unmount()
})

test('возврат на вкладку перечитывает сразу, не дожидаясь таймера', async () => {
  const view = await renderInDom(React.createElement(Probe, { mocked: null }))

  document.dispatchEvent(new Event('visibilitychange'))
  await view.settle()
  assert.equal(requests, 2)
  view.unmount()
})

test('демо-набор в сеть не ходит вовсе (62)', async () => {
  const view = await renderInDom(React.createElement(Probe, { mocked: [] }))

  assert.equal(timers, 0)
  assert.equal(requests, 0)
  view.unmount()
})
