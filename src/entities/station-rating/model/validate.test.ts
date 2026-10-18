import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parseStationRatingEntries,
  parseStoredStationRatings,
} from '@/entities/station-rating/model/validate'

test('ответ сервера разбирается построчно (45.6)', () => {
  const entries = parseStationRatingEntries({
    '3220': { rating: 'good', updatedAt: '2026-09-15T10:00:00Z' },
    '3221': { rating: 'не бывает', updatedAt: '2026-09-15T10:00:00Z' },
    '3222': { rating: 'bad' },
    '3223': { rating: 'blocked', updatedAt: '2026-09-15T10:00:00Z', note: 'тесно' },
  })

  assert.deepEqual(Object.keys(entries).sort(), ['3220', '3223'])
  assert.equal(entries['3223']?.note, 'тесно')
})

test('не объект — пустая карта, а не падение', () => {
  assert.deepEqual(parseStationRatingEntries(null), {})
  assert.deepEqual(parseStationRatingEntries('нет'), {})
  assert.deepEqual(parseStationRatingEntries(undefined), {})
})

test('у localStorage форма прежняя: версия вокруг записей', () => {
  const stored = parseStoredStationRatings({
    version: 1,
    entries: { '3220': { rating: 'good', updatedAt: '2026-09-15T10:00:00Z' } },
  })

  assert.equal(stored['3220']?.rating, 'good')
  assert.deepEqual(parseStoredStationRatings({ version: 99, entries: {} }), {})
})
