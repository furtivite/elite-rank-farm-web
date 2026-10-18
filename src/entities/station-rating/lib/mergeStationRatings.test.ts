import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeStationRatings } from '@/entities/station-rating/lib/mergeStationRatings'
import type { StationRatingsMap } from '@/entities/station-rating/model/types'

const local: StationRatingsMap = {
  '3220': { rating: 'good', updatedAt: '2026-09-15T10:00:00Z' },
  '3221': { rating: 'bad', updatedAt: '2026-09-15T10:00:00Z' },
  '3222': { rating: 'blocked', updatedAt: '2026-09-10T10:00:00Z' },
}

const remote: StationRatingsMap = {
  '3221': { rating: 'good', updatedAt: '2026-09-14T10:00:00Z' },
  '3222': { rating: 'good', updatedAt: '2026-09-15T12:00:00Z' },
  '3223': { rating: 'good', updatedAt: '2026-09-15T09:00:00Z' },
}

test('ничего не теряется: объединение, а не выбор копии (45.6)', () => {
  const merged = mergeStationRatings(local, remote)

  assert.deepEqual(Object.keys(merged).sort(), ['3220', '3221', '3222', '3223'])
})

test('по каждой станции побеждает более свежая запись', () => {
  const merged = mergeStationRatings(local, remote)

  assert.equal(merged['3221']?.rating, 'bad')
  assert.equal(merged['3222']?.rating, 'good')
})

test('запись, которой нет у второй стороны, приходит целиком', () => {
  const merged = mergeStationRatings(local, remote)

  assert.equal(merged['3220']?.rating, 'good')
  assert.equal(merged['3223']?.rating, 'good')
})

test('равное время оставляет ту запись, что была', () => {
  const at = '2026-09-15T10:00:00Z'
  const merged = mergeStationRatings(
    { x: { rating: 'good', updatedAt: at } },
    { x: { rating: 'bad', updatedAt: at } },
  )

  assert.equal(merged['x']?.rating, 'good')
})

test('объединение не трогает исходные копии', () => {
  const before = JSON.stringify(local)
  mergeStationRatings(local, remote)

  assert.equal(JSON.stringify(local), before)
})

test('пустая сторона ничего не меняет', () => {
  assert.deepEqual(mergeStationRatings(local, {}), local)
  assert.deepEqual(mergeStationRatings({}, remote), remote)
})
