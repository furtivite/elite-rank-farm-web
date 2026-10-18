import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isShuttling,
  mergeHistories,
  POSITION_HISTORY_LIMIT,
  recordVisit,
  type PositionVisit,
} from '@/entities/commander-state'

function visit(systemName: string, at: string): PositionVisit {
  return { systemName, at }
}

test('первым идёт то, где командир сейчас', () => {
  const history = recordVisit(
    [visit('Ngalinn', '2026-09-09T10:00:00Z')],
    'Canopus',
    '2026-09-09T10:30:00Z',
  )

  assert.deepEqual(
    history.map((entry) => entry.systemName),
    ['Canopus', 'Ngalinn'],
  )
})

test('та же система подряд не удваивается, но время обновляется', () => {
  const history = recordVisit(
    [visit('Ngalinn', '2026-09-09T10:00:00Z'), visit('Canopus', '2026-09-09T09:00:00Z')],
    'Ngalinn',
    '2026-09-09T10:40:00Z',
  )

  assert.equal(history.length, 2)
  assert.equal(history[0]?.at, '2026-09-09T10:40:00Z')
})

test('история не растёт бесконечно', () => {
  let history: PositionVisit[] = []
  for (let index = 0; index < POSITION_HISTORY_LIMIT + 10; index += 1) {
    history = recordVisit(history, `Система ${index}`, '2026-09-09T10:00:00Z')
  }

  assert.equal(history.length, POSITION_HISTORY_LIMIT)
  assert.equal(history[0]?.systemName, `Система ${POSITION_HISTORY_LIMIT + 9}`)
})

test('вернулся туда, откуда улетел, — это челнок', () => {
  const history = [
    visit('Ngalinn', '2026-09-09T11:00:00Z'),
    visit('Canopus', '2026-09-09T10:30:00Z'),
    visit('Ngalinn', '2026-09-09T10:00:00Z'),
  ]

  assert.equal(isShuttling(history, 'Ngalinn', 'Canopus'), true)
})

test('перелёт в одну сторону челноком не считается', () => {
  const history = [
    visit('Canopus', '2026-09-09T10:30:00Z'),
    visit('Ngalinn', '2026-09-09T10:00:00Z'),
  ]

  assert.equal(isShuttling(history, 'Canopus', 'Ngalinn'), false)
})

test('возка позавчера к нынешнему рейсу отношения не имеет', () => {
  const history = [
    visit('Ngalinn', '2026-09-09T11:00:00Z'),
    visit('Sol', '2026-09-09T10:40:00Z'),
    visit('Canopus', '2026-09-09T10:30:00Z'),
    visit('Ngalinn', '2026-09-09T10:00:00Z'),
  ]

  assert.equal(isShuttling(history, 'Ngalinn', 'Canopus'), false)
})

test('история агента и история браузера сливаются без склейки-призрака', () => {
  const fromAgent = [
    visit('Ngalinn', '2026-09-09T11:00:00Z'),
    visit('Canopus', '2026-09-09T10:30:00Z'),
  ]
  const local = [visit('Ngalinn', '2026-09-09T10:50:00Z'), visit('Sol', '2026-09-09T09:00:00Z')]

  const merged = mergeHistories(local, fromAgent)

  assert.deepEqual(
    merged.map((entry) => entry.systemName),
    ['Ngalinn', 'Canopus', 'Ngalinn', 'Sol'],
  )
})

test('свежая история браузера не затирается отставшей агентской', () => {
  const fromAgent = [visit('Canopus', '2026-09-09T10:00:00Z')]
  const local = [visit('Ngalinn', '2026-09-09T11:00:00Z'), visit('Canopus', '2026-09-09T10:00:00Z')]

  const merged = mergeHistories(local, fromAgent)

  assert.equal(merged[0]?.systemName, 'Ngalinn')
})

test('пустая история одной стороны отдаёт другую как есть', () => {
  const local = [visit('Ngalinn', '2026-09-09T11:00:00Z')]

  assert.deepEqual(mergeHistories(local, []), local)
  assert.deepEqual(mergeHistories([], local), local)
})
