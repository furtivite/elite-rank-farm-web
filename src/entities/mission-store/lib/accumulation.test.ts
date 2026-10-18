import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ACCUMULATION_DEFAULTS,
  ACCUMULATION_MAX,
  accumulationStatus,
  normalizeThresholds,
} from '@/entities/mission-store/lib/accumulation'

test('1 — подкопить, 3 — разумно, 5 — высокий приоритет', () => {
  assert.equal(accumulationStatus(1), 'accumulate')
  assert.equal(accumulationStatus(3), 'reasonable')
  assert.equal(accumulationStatus(5), 'high')
})

test('границы включительные', () => {
  assert.equal(accumulationStatus(2), 'accumulate')
  assert.equal(accumulationStatus(4), 'reasonable')
})

test('ноль активных миссий — подкопить, а не ошибка', () => {
  assert.equal(accumulationStatus(0), 'accumulate')
})

test('порог настраивается', () => {
  assert.equal(accumulationStatus(2, { reasonable: 2, high: 4 }), 'reasonable')
  assert.equal(accumulationStatus(2, { reasonable: 3, high: 4 }), 'accumulate')
})

test('«высокий» не может быть ниже «разумно»', () => {
  assert.deepEqual(normalizeThresholds({ reasonable: 5, high: 2 }), { reasonable: 5, high: 5 })
})

test('мусор приводится к диапазону, а не роняет статус', () => {
  assert.deepEqual(normalizeThresholds({ reasonable: NaN, high: Infinity }), {
    reasonable: 1,
    high: ACCUMULATION_MAX,
  })
  assert.deepEqual(normalizeThresholds({ reasonable: -3, high: 2.6 }), { reasonable: 1, high: 3 })
})

test('умолчания совпадают с примером спецификации', () => {
  assert.deepEqual(ACCUMULATION_DEFAULTS, { reasonable: 3, high: 5 })
})
