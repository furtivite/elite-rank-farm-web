import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import {
  arrivalStarNote,
  formatArrivalDistance,
  isDistantArrival,
} from '@/entities/galaxy-data/lib/arrivalStar'

const en = createTranslate('en')

test('станция у вторичной звезды получает отметку с её именем (80)', () => {
  assert.equal(
    arrivalStarNote({ name: 'HIP 6807 B', isMain: false, source: 'dump' }, en),
    'another star: HIP 6807 B',
  )
})

test('у главной звезды отмечать нечего — туда и прилетают', () => {
  assert.equal(arrivalStarNote({ name: 'HIP 6807 A', isMain: true, source: 'dump' }, en), null)
})

test('без звезды отметки нет, и это не значит «у главной»', () => {
  assert.equal(arrivalStarNote(undefined, en), null)
})

const ru = createTranslate('ru')

test('расстояние до станции читается: разряды разделены (85.2)', () => {
  assert.equal(formatArrivalDistance(402016.981828, ru), '402\u00a0017\u00a0св.\u00a0с.')
  assert.equal(formatArrivalDistance(75585.177039, ru), '75\u00a0585\u00a0св.\u00a0с.')
  assert.equal(formatArrivalDistance(580, ru), '580\u00a0св.\u00a0с.')
})

test('по-английски разряды разделяются запятой, а не пробелом (92.4)', () => {
  assert.equal(formatArrivalDistance(402016.981828, en), '402,017\u00a0ls')
  assert.equal(formatArrivalDistance(580, en), '580\u00a0ls')
})

test('отдельным перелётом считается то, что за последней ступенью шкалы', () => {
  assert.equal(isDistantArrival(19_999), false)
  assert.equal(isDistantArrival(20_000), true)
  assert.equal(isDistantArrival(402_017), true)
})

test('неизвестное расстояние отдельным перелётом не считается', () => {
  assert.equal(isDistantArrival(undefined), false)
})

test('ручная отметка говорит «другая звезда» без имени (86)', () => {
  assert.equal(arrivalStarNote({ isMain: false, source: 'manual' }, en), 'another star')
})
