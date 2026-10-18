import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import {
  describeSlotCount,
  formatSlotCount,
  slotCount,
} from '@/entities/mission-store/lib/slotCount'

const ru = createTranslate('ru')

test('обычный счёт: ручные считаются наравне (14.1)', () => {
  const count = slotCount(12, 2, false)

  assert.equal(formatSlotCount(count), '14 / 20')
  assert.equal(count.aside, null)
  assert.equal(count.canAddManual, true)
})

test('на двадцати добавление блокируется, пока ручные считаются', () => {
  assert.equal(slotCount(18, 2, false).canAddManual, false)
})

test('ручные вне счёта: «20 (8) / 20» (70.9)', () => {
  const count = slotCount(20, 8, true)

  assert.equal(formatSlotCount(count), '20 (8) / 20')
  assert.equal(count.used, 20)
  assert.equal(count.aside, 8)
})

test('ручные вне счёта: лимит к ним не применяется', () => {
  assert.equal(slotCount(20, 8, true).canAddManual, true)
})

test('без ручных записей скобок не появляется', () => {
  assert.equal(formatSlotCount(slotCount(20, 0, true)), '20 / 20')
})

test('у счётчика есть словесная пара для screen reader', () => {
  assert.equal(
    describeSlotCount(slotCount(20, 8, true), ru),
    'Занято слотов: 20 из 20. Добавлено вручную и не учитывается: 8',
  )
  assert.equal(describeSlotCount(slotCount(14, 0, false), ru), 'Занято слотов: 14 из 20')
})

test('счётчик считает и задания из игры, и ручные (70.2)', () => {
  assert.equal(formatSlotCount(slotCount(9, 3, false)), '12 / 20')
})
