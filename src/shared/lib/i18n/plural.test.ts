import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pluralize } from '@/shared/lib/i18n/plural'

const missions = { one: 'задание', few: 'задания', many: 'заданий' }

test('русские формы: 1, 2, 5', () => {
  assert.equal(pluralize('ru', 1, missions), 'задание')
  assert.equal(pluralize('ru', 2, missions), 'задания')
  assert.equal(pluralize('ru', 5, missions), 'заданий')
})

test('русские формы: подростковые числа — исключение', () => {
  assert.equal(pluralize('ru', 11, missions), 'заданий')
  assert.equal(pluralize('ru', 12, missions), 'заданий')
  assert.equal(pluralize('ru', 14, missions), 'заданий')
  assert.equal(pluralize('ru', 21, missions), 'задание')
  assert.equal(pluralize('ru', 22, missions), 'задания')
  assert.equal(pluralize('ru', 111, missions), 'заданий')
})

test('ноль — «многие», а не «одно»', () => {
  assert.equal(pluralize('ru', 0, missions), 'заданий')
})

test('английский: только единственное и множественное', () => {
  const en = { one: 'mission', many: 'missions' }
  assert.equal(pluralize('en', 1, en), 'mission')
  assert.equal(pluralize('en', 0, en), 'missions')
  assert.equal(pluralize('en', 2, en), 'missions')
  assert.equal(pluralize('en', 21, en), 'missions')
})
