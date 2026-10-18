import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import {
  _resetMissionStoreForTests,
  getMissionsSnapshot,
  setMissionDemoSeed,
  subscribeToForgottenMissions,
  writeMissions,
} from '@/entities/mission-store/model/store'
import type { StoredMission } from '@/entities/mission-store/model/types'
import { _resetDemoSandboxForTests, setDemoSandboxActive } from '@/shared/lib/demoSandbox'

const saved: Record<string, string> = {}

function mission(id: string): StoredMission {
  return {
    id,
    targetSystem: 'HIP 6108',
    targetStation: 'Wheeler Hub',
    addedAt: '2026-09-03T09:40:00Z',
  }
}

beforeEach(() => {
  for (const key of Object.keys(saved)) {
    delete saved[key]
  }
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => saved[key] ?? null,
    setItem: (key: string, value: string) => {
      saved[key] = value
    },
    removeItem: (key: string) => {
      delete saved[key]
    },
  }
  ;(globalThis as { window?: unknown }).window = globalThis
  _resetDemoSandboxForTests()
  _resetMissionStoreForTests()
})

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage
  delete (globalThis as { window?: unknown }).window
})

test('набор показывает свои записи, а не настоящие', () => {
  writeMissions([mission('real')])
  setMissionDemoSeed([mission('demo')])
  setDemoSandboxActive(true)

  assert.deepEqual(
    getMissionsSnapshot().map((item) => item.id),
    ['demo'],
  )
})

test('набор без своих записей показывает копию настоящих', () => {
  writeMissions([mission('real')])
  setDemoSandboxActive(true)

  assert.deepEqual(
    getMissionsSnapshot().map((item) => item.id),
    ['real'],
  )
})

test('кнопки показа не доходят до браузера', () => {
  writeMissions([mission('real')])
  const before = JSON.stringify(saved)

  setMissionDemoSeed([mission('demo')])
  setDemoSandboxActive(true)
  writeMissions([])
  writeMissions([mission('demo'), mission('added-in-demo')])

  assert.equal(JSON.stringify(saved), before)
})

test('выключили набор — вернулся настоящий список, каким был', () => {
  writeMissions([mission('real')])
  setMissionDemoSeed([mission('demo')])
  setDemoSandboxActive(true)
  writeMissions([])
  setMissionDemoSeed(null)
  setDemoSandboxActive(false)

  assert.deepEqual(
    getMissionsSnapshot().map((item) => item.id),
    ['real'],
  )
})

test('тот же набор повторно не стирает нажатое в показе', () => {
  const seed = [mission('demo')]
  setMissionDemoSeed(seed)
  setDemoSandboxActive(true)
  writeMissions([])
  setMissionDemoSeed(seed)
  setDemoSandboxActive(true)

  assert.deepEqual(getMissionsSnapshot(), [])
})

function forgotten(change: () => void): string[] {
  const seen: string[] = []
  const unsubscribe = subscribeToForgottenMissions((ids) => seen.push(...ids))
  change()
  unsubscribe()

  return seen
}

test('удалённые записи названы поимённо, а не «список изменился»', () => {
  writeMissions([mission('m1'), mission('m2'), mission('m3')])

  const gone = forgotten(() => {
    writeMissions([mission('m2')])
  })

  assert.deepEqual(gone.sort(), ['m1', 'm3'])
})

test('добавление ничего не удаляет', () => {
  writeMissions([mission('m1')])

  assert.deepEqual(
    forgotten(() => {
      writeMissions([mission('m1'), mission('m2')])
    }),
    [],
  )
})

test('очистка корзины называет все записи разом', () => {
  writeMissions([mission('m1'), mission('m2')])

  assert.deepEqual(
    forgotten(() => {
      writeMissions([])
    }).sort(),
    ['m1', 'm2'],
  )
})

test('первая запись после загрузки страницы удалением не считается', () => {
  _resetMissionStoreForTests()

  assert.deepEqual(
    forgotten(() => {
      writeMissions([mission('m1')])
    }),
    [],
  )
})

test('в показе сигнала нет: там всё понарошку (70.4)', () => {
  writeMissions([mission('m1')])
  setDemoSandboxActive(true)

  const gone = forgotten(() => {
    writeMissions([])
  })

  setDemoSandboxActive(false)
  assert.deepEqual(gone, [])
})
