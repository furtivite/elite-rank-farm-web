import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isWorthLoading } from '@/features/farm-recommender/lib/worthLoading'
import type { SystemIndexEntry } from '@/entities/galaxy-data'

function entry(extra: Partial<SystemIndexEntry> = {}): SystemIndexEntry {
  return {
    id: '1',
    name: 'Ngalinn',
    x: 0,
    y: 0,
    z: 0,
    chunk: 'chunks/chunk-001.json',
    ...extra,
  }
}

test('система без единой доски заданий не грузится', () => {
  assert.equal(isWorthLoading(entry({ stations: 4, missionBoards: 0 }), undefined), false)
})

test('система с досками грузится', () => {
  assert.equal(isWorthLoading(entry({ stations: 4, missionBoards: 2 }), undefined), true)
})

test('без большой площадки не грузится только при запросе большой', () => {
  const noLarge = entry({ stations: 3, missionBoards: 3, largePad: false })

  assert.equal(isWorthLoading(noLarge, 'L'), false)
  assert.equal(isWorthLoading(noLarge, 'M'), true, 'среднему кораблю она подходит')
  assert.equal(isWorthLoading(noLarge, undefined), true)
})

test('старый снимок без признаков грузится целиком', () => {
  assert.equal(isWorthLoading(entry(), 'L'), true)
  assert.equal(isWorthLoading(entry({ stations: 2 }), 'L'), true)
})
