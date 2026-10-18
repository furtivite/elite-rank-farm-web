import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canLand,
  isPadCompatible,
  isPadOptionAvailable,
  PAD_SIZE_OPTIONS,
} from '@/features/farm-recommender/lib/padCompatibility'

test('корабль садится на свой размер и больше', () => {
  assert.equal(canLand('S', 'S'), true)
  assert.equal(canLand('S', 'M'), true)
  assert.equal(canLand('S', 'L'), true)

  assert.equal(canLand('M', 'S'), false)
  assert.equal(canLand('M', 'M'), true)
  assert.equal(canLand('M', 'L'), true)

  assert.equal(canLand('L', 'S'), false)
  assert.equal(canLand('L', 'M'), false)
  assert.equal(canLand('L', 'L'), true)
})

test('станция подходит, если её площадка не меньше требуемой', () => {
  assert.equal(isPadCompatible('L', 'M'), true)
  assert.equal(isPadCompatible('M', 'M'), true)
  assert.equal(isPadCompatible('S', 'M'), false)
})

test('неизвестная площадка станции не отсекается (todo 12)', () => {
  assert.equal(isPadCompatible(undefined, 'L'), true)
  assert.equal(isPadCompatible('S', undefined), true)
})

test('кораблю доступны его размер и больше, но не меньше', () => {
  assert.equal(isPadOptionAvailable('S', 'M'), false)
  assert.equal(isPadOptionAvailable('M', 'M'), true)
  assert.equal(isPadOptionAvailable('L', 'M'), true)
})

test('«Любой» доступен малому кораблю и никому больше', () => {
  assert.equal(isPadOptionAvailable('', 'S'), true)
  assert.equal(isPadOptionAvailable('', 'M'), false)
  assert.equal(isPadOptionAvailable('', 'L'), false)
})

test('большому кораблю доступен только Large', () => {
  const available = PAD_SIZE_OPTIONS.filter((option) => isPadOptionAvailable(option, 'L'))
  assert.deepEqual(available, ['L'])
})

test('малому кораблю доступны все пункты', () => {
  const available = PAD_SIZE_OPTIONS.filter((option) => isPadOptionAvailable(option, 'S'))
  assert.deepEqual(available, ['', 'S', 'M', 'L'])
})

test('без известного корабля не ограничиваем ничего', () => {
  const available = PAD_SIZE_OPTIONS.filter((option) => isPadOptionAvailable(option, null))
  assert.deepEqual(available, [...PAD_SIZE_OPTIONS])
})

test('смена корабля меняет набор доступных вариантов', () => {
  const availableFor = (required: 'S' | 'M' | 'L' | null) =>
    PAD_SIZE_OPTIONS.filter((option) => isPadOptionAvailable(option, required))

  assert.deepEqual(availableFor('S'), ['', 'S', 'M', 'L'])
  assert.deepEqual(availableFor('L'), ['L'])
  assert.deepEqual(availableFor('M'), ['M', 'L'])
})
