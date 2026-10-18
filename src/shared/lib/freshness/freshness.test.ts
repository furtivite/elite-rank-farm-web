import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import { ageInMs, formatAge, freshness, STALE_AFTER_DAYS, startOfDay } from '@/shared/lib/freshness'

const ru = createTranslate('ru')
const en = createTranslate('en')

const NOW = new Date('2026-09-03T12:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY).toISOString()
}

test('свежее до порога, устаревшее после', () => {
  assert.equal(freshness(daysAgo(1), NOW), 'fresh')
  assert.equal(freshness(daysAgo(STALE_AFTER_DAYS), NOW), 'fresh')
  assert.equal(freshness(daysAgo(STALE_AFTER_DAYS + 1), NOW), 'stale')
})

test('без метки времени — unknown, а не «бесконечно старое» (30)', () => {
  assert.equal(freshness(undefined, NOW), 'unknown')
  assert.equal(freshness('', NOW), 'unknown')
  assert.equal(freshness('позавчера', NOW), 'unknown')
})

test('дата из будущего даёт нулевой возраст, а не отрицательный', () => {
  assert.equal(ageInMs(daysAgo(-2), NOW), 0)
  assert.equal(freshness(daysAgo(-2), NOW), 'fresh')
})

test('возраст читается словами', () => {
  assert.equal(formatAge(daysAgo(0), NOW, ru), 'сегодня')
  assert.equal(formatAge(daysAgo(1), NOW, ru), '1 день назад')
  assert.equal(formatAge(daysAgo(3), NOW, ru), '3 дня назад')
  assert.equal(formatAge(daysAgo(11), NOW, ru), '11 дней назад')
  assert.equal(formatAge(daysAgo(120), NOW, ru), '4 месяца назад')
  assert.equal(formatAge(daysAgo(400), NOW, ru), '1 год назад')
})

test('возраст на границе года не обнуляется', () => {
  assert.equal(formatAge(daysAgo(359), NOW, ru), '11 месяцев назад')
  assert.equal(formatAge(daysAgo(361), NOW, ru), '12 месяцев назад')
  assert.equal(formatAge(daysAgo(364), NOW, ru), '12 месяцев назад')
  assert.equal(formatAge(daysAgo(365), NOW, ru), '1 год назад')
})

test('возраст читается словами и по-английски', () => {
  assert.equal(formatAge(daysAgo(0), NOW, en), 'today')
  assert.equal(formatAge(daysAgo(1), NOW, en), '1 day ago')
  assert.equal(formatAge(daysAgo(3), NOW, en), '3 days ago')
  assert.equal(formatAge(daysAgo(11), NOW, en), '11 days ago')
  assert.equal(formatAge(daysAgo(400), NOW, en), '1 year ago')
})

test('без метки времени возраста нет', () => {
  assert.equal(formatAge(undefined, NOW, ru), null)
})

test('порог настраивается вызывающим', () => {
  assert.equal(freshness(daysAgo(10), NOW, 7), 'stale')
  assert.equal(freshness(daysAgo(10), NOW, 30), 'fresh')
})

test('начало суток одинаково для любого момента этих суток', () => {
  const morning = new Date(2026, 8, 4, 7, 15, 30).getTime()
  const evening = new Date(2026, 8, 4, 23, 59, 59).getTime()

  assert.equal(startOfDay(morning), startOfDay(evening))
  assert.equal(startOfDay(morning), new Date(2026, 8, 4).getTime())
  assert.notEqual(startOfDay(evening), startOfDay(evening + 1000))
})
