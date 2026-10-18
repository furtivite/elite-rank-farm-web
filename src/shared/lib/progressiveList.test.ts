import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PROGRESSIVE_START,
  progressiveSlice,
  type ProgressiveState,
} from '@/shared/lib/progressiveList'

const items = Array.from({ length: 120 }, (_, index) => index)

test('первая порция — ровно размер страницы', () => {
  const page = progressiveSlice(items, PROGRESSIVE_START, '', 50)

  assert.equal(page.shown.length, 50)
  assert.equal(page.rest, 70)
  assert.equal(page.nextChunk, 50)
})

test('нажатие кнопки добавляет ровно одну порцию', () => {
  const first = progressiveSlice(items, PROGRESSIVE_START, '', 50)
  const second = progressiveSlice(items, first.next, '', 50)

  assert.equal(second.shown.length, 100)
  assert.equal(second.rest, 20)
  assert.equal(second.nextChunk, 20)
})

test('когда всё показано, кнопки нет', () => {
  const state: ProgressiveState = { key: '', pages: 3 }
  const page = progressiveSlice(items, state, '', 50)

  assert.equal(page.shown.length, 120)
  assert.equal(page.rest, 0)
  assert.equal(page.nextChunk, 0)
})

test('смена ключа начинает список заново', () => {
  const opened: ProgressiveState = { key: 'ngalinn', pages: 3 }
  const page = progressiveSlice(items, opened, 'canopus', 50)

  assert.equal(page.shown.length, 50)
  assert.equal(page.next.key, 'canopus')
  assert.equal(page.next.pages, 2)
})

test('тот же ключ открытые страницы сохраняет', () => {
  const opened: ProgressiveState = { key: 'ngalinn', pages: 2 }
  const page = progressiveSlice(items, opened, 'ngalinn', 50)

  assert.equal(page.shown.length, 100)
})

test('список короче страницы показывается целиком и без кнопки', () => {
  const page = progressiveSlice([1, 2, 3], PROGRESSIVE_START, '', 50)

  assert.deepEqual(page.shown, [1, 2, 3])
  assert.equal(page.rest, 0)
})

test('пустой список не ломается', () => {
  const page = progressiveSlice([], PROGRESSIVE_START, '', 50)

  assert.deepEqual(page.shown, [])
  assert.equal(page.rest, 0)
  assert.equal(page.nextChunk, 0)
})

test('битое состояние не показывает пустоту: страниц не меньше одной', () => {
  const broken: ProgressiveState = { key: '', pages: 0 }

  assert.equal(progressiveSlice(items, broken, '', 50).shown.length, 50)
})
