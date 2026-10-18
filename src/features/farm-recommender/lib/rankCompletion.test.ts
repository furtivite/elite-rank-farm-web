import assert from 'node:assert/strict'
import test from 'node:test'

import type { NavyProgress } from '@/entities/commander-state'
import { state } from '@/entities/commander-state/model/mockState'
import {
  completedSides,
  effectiveFarmMode,
  NO_COMPLETED_SIDES,
} from '@/features/farm-recommender/lib/rankCompletion'

function progress(imperial: number, federal: number): NavyProgress {
  return {
    imperial: { percent: imperial, at: null },
    federal: { percent: federal, at: null },
  }
}

test('сторона докачана при ста процентах в любом звании', () => {
  const data = state({ imperialRank: 5, federalRank: 3 }).state

  assert.deepEqual(completedSides(data, progress(100, 99)), { empire: true, federal: false })
})

test('высшее звание докачано и без ста процентов', () => {
  const data = state({ imperialRank: 14, federalRank: 14 }).state

  assert.deepEqual(completedSides(data, progress(47, 0)), { empire: true, federal: true })
})

test('процент берётся с поправкой на повышение, а не сырой из состояния', () => {
  const data = state({ imperialRank: 6, imperialProgress: 100 }).state

  assert.equal(completedSides(data, progress(0, 0)).empire, false)
})

test('без состояния командира докачанных сторон нет', () => {
  assert.deepEqual(completedSides(null, null), NO_COMPLETED_SIDES)
})

test('докачанная Империя переключает поиск на Федерацию и наоборот', () => {
  assert.equal(effectiveFarmMode('empire', { empire: true, federal: false }), 'federal')
  assert.equal(effectiveFarmMode('federal', { empire: false, federal: true }), 'empire')
})

test('выбор человека держится, пока его сторону есть что качать', () => {
  assert.equal(effectiveFarmMode('empire', { empire: false, federal: true }), 'empire')
  assert.equal(effectiveFarmMode('federal', NO_COMPLETED_SIDES), 'federal')
})

test('докачаны обе — выбор остаётся как был', () => {
  assert.equal(effectiveFarmMode('federal', { empire: true, federal: true }), 'federal')
})
