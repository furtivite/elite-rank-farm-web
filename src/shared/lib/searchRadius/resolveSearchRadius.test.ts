import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DEFAULT_JUMP_MULTIPLIER,
  isMultiplierAvailable,
  reliableJumps,
  resolveSearchRadius,
  starLayerRadiusLy,
} from '@/shared/lib/searchRadius'

test('умолчание — одна дальность прыжка, прежнее поведение', () => {
  assert.equal(DEFAULT_JUMP_MULTIPLIER, 1)
})

test('радиус — произведение, пока помещается в регион', () => {
  const { radiusLy, clamped } = resolveSearchRadius(39.83, 2, 100)

  assert.equal(radiusLy, 79.66)
  assert.equal(clamped, false)
})

test('за границей датасета радиус зажимается, и это видно', () => {
  const { radiusLy, clamped, requestedLy } = resolveSearchRadius(39.83, 3, 100)

  assert.equal(radiusLy, 100)
  assert.equal(clamped, true)
  assert.ok(requestedLy > 100, 'запрошенное сохраняется — иначе нечего показать в подписи')
})

test('без радиуса региона остаётся предел загрузки', () => {
  assert.deepEqual(resolveSearchRadius(40, 5, null), {
    radiusLy: 150,
    clamped: true,
    requestedLy: 200,
  })
})

test('снимок галактики не отменяет предел загрузки', () => {
  assert.equal(resolveSearchRadius(60, 5, 50000).radiusLy, 150)
})

test('cutter на «×5» получает то, что попросил (102.16)', () => {
  const wide = resolveSearchRadius(23.22, 5, 50000)
  assert.equal(wide.clamped, false)
  assert.ok(wide.radiusLy > 100, `область ${wide.radiusLy} обязана выйти за прежний предел`)
  assert.equal(isMultiplierAvailable(23.22, 5, 50000), true)
})

test('снимок меньше предела зажимает сильнее', () => {
  assert.equal(resolveSearchRadius(40, 2, 40).radiusLy, 40)
})

test('вариант недоступен, когда выходит за датасет', () => {
  assert.equal(isMultiplierAvailable(39.83, 2, 100), true)
  assert.equal(isMultiplierAvailable(39.83, 3, 100), false)
  assert.equal(isMultiplierAvailable(8.45, 5, 100), true)
})

test('неизвестная дальность ничего не запрещает', () => {
  assert.equal(isMultiplierAvailable(null, 5, 100), true)
  assert.equal(isMultiplierAvailable(0, 5, 100), true)
  assert.equal(isMultiplierAvailable(40, 5, null), true)
})

test('вслух обещается на прыжок меньше выбранного, но не ноль', () => {
  assert.equal(reliableJumps(1), 1)
  assert.equal(reliableJumps(3), 2)
  assert.equal(reliableJumps(5), 4)
})

test('слой звёзд берётся под область поиска плюс один прыжок', () => {
  assert.equal(starLayerRadiusLy(40, 1), 80)
  assert.equal(starLayerRadiusLy(40, 2), 120)
})

test('слой не растёт за потолок области, хотя запас на прыжок остаётся', () => {
  assert.equal(starLayerRadiusLy(60, 3), 210)
})

test('нулевая дальность не просит слоя вовсе', () => {
  assert.equal(starLayerRadiusLy(0, 3), 0)
})
