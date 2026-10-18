import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  applyStateFromLeader,
  getCommanderSnapshot,
  loadCommanderState,
  resetCommanderState,
  shouldSkipPoll,
  subscribeToCommander,
} from '@/entities/commander-state/model/commanderStore'

const realFetch = globalThis.fetch

function stubFetch(handler: () => Promise<Response>): void {
  globalThis.fetch = handler as unknown as typeof globalThis.fetch
}

const UPDATED_AT = new Date().toISOString()

function staleResponse(updatedAt: string): Response {
  return new Response(
    JSON.stringify({
      status: 'ok',
      state: {
        schemaVersion: 4,
        commanderName: 'CMDR SILENT',
        currentSystem: { name: 'Ngalinn', x: 1, y: 2, z: 3 },
        currentStation: null,
        currentBody: null,
        ship: 'python',
        requiredPadSize: null,
        jumpRangeLy: 40,
        imperialRank: 1,
        imperialProgress: 10,
        imperialProgressAt: '2026-09-03T09:00:00Z',
        federalRank: 1,
        federalProgress: 10,
        federalProgressAt: '2026-09-03T09:00:00Z',
        observedAt: updatedAt,
      },
      updatedAt,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function stateResponse(commanderName: string, observedAt = '2026-09-03T12:00:00Z'): Response {
  return new Response(
    JSON.stringify({
      status: 'ok',
      state: {
        schemaVersion: 4,
        commanderName,
        currentSystem: { name: 'Ngalinn', x: 1, y: 2, z: 3 },
        currentStation: null,
        currentBody: null,
        ship: 'python',
        requiredPadSize: null,
        jumpRangeLy: 40,
        imperialRank: 1,
        imperialProgress: 10,
        imperialProgressAt: '2026-09-03T09:00:00Z',
        federalRank: 1,
        federalProgress: 10,
        federalProgressAt: '2026-09-03T09:00:00Z',
        observedAt,
      },
      updatedAt: UPDATED_AT,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

afterEach(() => {
  globalThis.fetch = realFetch
  resetCommanderState()
})

test('одновременные запросы не наслаиваются', async () => {
  let calls = 0
  stubFetch(async () => {
    calls += 1
    await new Promise((resolve) => setTimeout(resolve, 10))
    return stateResponse(`CMDR ${calls}`)
  })

  await Promise.all([loadCommanderState(true), loadCommanderState(true), loadCommanderState()])

  assert.equal(calls, 1, 'должен был уйти ровно один запрос')
  assert.equal(getCommanderSnapshot().data?.state.commanderName, 'CMDR 1')
})

test('после завершения запроса следующий снова уходит', async () => {
  let calls = 0
  stubFetch(async () => {
    calls += 1
    return stateResponse(`CMDR ${calls}`)
  })

  await loadCommanderState(true)
  await loadCommanderState(true)

  assert.equal(calls, 2)
})

test('опрос редеет после неудач и восстанавливается после успеха', async () => {
  stubFetch(async () => new Response('nope', { status: 500 }))

  assert.equal(shouldSkipPoll(1), false)

  await loadCommanderState(true)
  assert.equal(shouldSkipPoll(1), true)
  assert.equal(shouldSkipPoll(2), false)

  await loadCommanderState(true)
  assert.equal(shouldSkipPoll(2), true)
  assert.equal(shouldSkipPoll(4), false)

  stubFetch(async () => stateResponse('CMDR OK'))
  await loadCommanderState(true)

  assert.equal(shouldSkipPoll(1), false)
})

test('неудача не стирает прочитанное состояние', async () => {
  stubFetch(async () => stateResponse('CMDR OK'))
  await loadCommanderState(true)

  stubFetch(async () => new Response('nope', { status: 500 }))
  await loadCommanderState(true)

  const snapshot = getCommanderSnapshot()
  assert.equal(snapshot.data?.state.commanderName, 'CMDR OK')
  assert.equal(snapshot.status, 'error')
})

test('пока состояние меняется, опрос идёт каждый раз', async () => {
  let minute = 0
  stubFetch(async () => {
    minute += 1
    return stateResponse('CMDR', `2026-09-03T12:${String(minute).padStart(2, '0')}:00Z`)
  })

  for (let i = 0; i < 10; i += 1) {
    await loadCommanderState(true)
    assert.equal(shouldSkipPoll(i + 1), false)
  }
})

test('минута одинаковых ответов — опрос редеет вдвое', async () => {
  stubFetch(async () => stateResponse('CMDR', '2026-09-03T12:00:00Z'))

  for (let i = 0; i < 7; i += 1) {
    await loadCommanderState(true)
  }

  assert.equal(shouldSkipPoll(1), true, 'нечётный опрос пропускается')
  assert.equal(shouldSkipPoll(2), false, 'чётный проходит')
})

test('свежее наблюдение возвращает частоту сразу', async () => {
  let observedAt = '2026-09-03T12:00:00Z'
  stubFetch(async () => stateResponse('CMDR', observedAt))

  for (let i = 0; i < 12; i += 1) {
    await loadCommanderState(true)
  }
  assert.equal(shouldSkipPoll(1), true)

  observedAt = '2026-09-03T12:30:00Z'
  await loadCommanderState(true)

  assert.equal(shouldSkipPoll(1), false)
  assert.equal(shouldSkipPoll(3), false)
})

test('тот же ответ не пересобирает снимок (90.6)', async () => {
  stubFetch(async () => stateResponse('CMDR', '2026-09-03T12:00:00Z'))

  await loadCommanderState(true)
  const first = getCommanderSnapshot()

  let notified = 0
  const stop = subscribeToCommander(() => {
    notified += 1
  })

  await loadCommanderState(true)
  await loadCommanderState(true)
  stop()

  assert.equal(getCommanderSnapshot(), first, 'снимок обязан остаться тем же объектом')
  assert.equal(notified, 0, 'подписчиков дёргать не за чем')
})

test('изменившийся ответ снимок пересобирает', async () => {
  let observedAt = '2026-09-03T12:00:00Z'
  stubFetch(async () => stateResponse('CMDR', observedAt))

  await loadCommanderState(true)
  const first = getCommanderSnapshot()

  observedAt = '2026-09-03T12:05:00Z'
  await loadCommanderState(true)

  assert.notEqual(getCommanderSnapshot(), first)
  assert.equal(getCommanderSnapshot().data?.state.observedAt, observedAt)
})

test('при часовом молчании агента опрос редеет сильнее обычного', async () => {
  const hourAgo = new Date(Date.now() - 61 * 60 * 1000).toISOString()
  stubFetch(async () => staleResponse(hourAgo))

  await loadCommanderState(true)

  assert.equal(shouldSkipPoll(4), true)
  assert.equal(shouldSkipPoll(12), false)
})

test('вернувшийся агент возвращает обычный ритм сразу', async () => {
  const hourAgo = new Date(Date.now() - 61 * 60 * 1000).toISOString()
  stubFetch(async () => staleResponse(hourAgo))
  await loadCommanderState(true)
  assert.equal(shouldSkipPoll(4), true)

  stubFetch(async () => stateResponse('CMDR BACK', new Date().toISOString()))
  await loadCommanderState(true)

  assert.equal(shouldSkipPoll(1), false)
})

test('состояние от главной вкладки попадает в снимок', () => {
  const response = JSON.parse(
    '{"state":{"schemaVersion":4,"commanderName":"CMDR SHARED","currentSystem":{"name":"Ngalinn","x":1,"y":2,"z":3},"currentStation":null,"currentBody":null,"ship":"python","requiredPadSize":null,"jumpRangeLy":40,"imperialRank":1,"imperialProgress":10,"imperialProgressAt":"2026-09-03T09:00:00Z","federalRank":1,"federalProgress":10,"federalProgressAt":"2026-09-03T09:00:00Z","observedAt":"2026-09-03T12:00:00Z"},"updatedAt":"2026-09-03T12:00:01Z"}',
  )

  applyStateFromLeader(response)

  assert.equal(getCommanderSnapshot().status, 'success')
  assert.equal(getCommanderSnapshot().data?.state.commanderName, 'CMDR SHARED')
})

test('«состояния нет» тоже раздаётся, а не молчит', () => {
  applyStateFromLeader(null)

  assert.equal(getCommanderSnapshot().status, 'not-found')
  assert.equal(getCommanderSnapshot().data, null)
})
