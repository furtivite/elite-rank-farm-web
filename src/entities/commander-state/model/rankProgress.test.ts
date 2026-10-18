import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  displayedProgress,
  isProgressStale,
  trackProgress,
  type ProgressTracker,
} from '@/entities/commander-state/model/rankProgress'

function feed(pairs: Array<[number, number]>): number[] {
  let tracker: ProgressTracker | null = null
  return pairs.map(([rank, progress]) => {
    tracker = trackProgress(tracker, { rank, progress })
    return displayedProgress(tracker)
  })
}

test('обычный поток показывает присланный процент', () => {
  assert.deepEqual(
    feed([
      [7, 71],
      [7, 74],
      [7, 90],
    ]),
    [71, 74, 90],
  )
})

test('звание выросло, процент не сдвинулся — показываем 0 (43.3)', () => {
  assert.deepEqual(
    feed([
      [7, 71],
      [8, 71],
    ]),
    [71, 0],
  )
})

test('ноль держится, пока не пришёл настоящий процент', () => {
  assert.deepEqual(
    feed([
      [7, 71],
      [8, 71],
      [8, 71],
      [8, 71],
      [8, 3],
    ]),
    [71, 0, 0, 0, 3],
  )
})

test('агент прислал обнулённый прогресс — верим ему сразу', () => {
  assert.deepEqual(
    feed([
      [7, 71],
      [8, 0],
      [8, 12],
    ]),
    [71, 0, 12],
  )
})

test('повышение через несколько званий подряд', () => {
  assert.deepEqual(
    feed([
      [2, 55],
      [3, 55],
      [4, 55],
      [4, 8],
    ]),
    [55, 0, 0, 8],
  )
})

test('первое наблюдение показывается как есть', () => {
  assert.deepEqual(feed([[3, 42]]), [42])
})

test('понижение звания не считается устаревшим процентом', () => {
  assert.deepEqual(
    feed([
      [8, 40],
      [2, 40],
    ]),
    [40, 40],
  )
})

test('без наблюдений прогресс нулевой', () => {
  assert.equal(displayedProgress(null), 0)
})

test('страховочный ноль отличим от настоящего процента (49.2)', () => {
  let tracker: ProgressTracker | null = null
  tracker = trackProgress(tracker, { rank: 7, progress: 71 })
  assert.equal(isProgressStale(tracker), false)

  tracker = trackProgress(tracker, { rank: 8, progress: 71 })
  assert.equal(isProgressStale(tracker), true)
  assert.equal(displayedProgress(tracker), 0)

  tracker = trackProgress(tracker, { rank: 8, progress: 0 })
  assert.equal(isProgressStale(tracker), false)
})
