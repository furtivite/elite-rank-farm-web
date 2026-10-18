import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DEFAULT_OTHER_STARS_PAGE_SIZE,
  getOtherStarsPageSizeSnapshot,
  writeOtherStarsPageSize,
} from '@/shared/lib/otherStarsPageSize'
import { DEFAULT_RESULTS_PAGE_SIZE, getResultsPageSizeSnapshot } from '@/shared/lib/resultsOrder'

test('внешние звёзды показываются по десять', () => {
  assert.equal(DEFAULT_OTHER_STARS_PAGE_SIZE, 10)
})

test('порция страницы и порция выдачи независимы', () => {
  writeOtherStarsPageSize(50)

  assert.equal(getOtherStarsPageSizeSnapshot(), 50)
  assert.equal(getResultsPageSizeSnapshot(), DEFAULT_RESULTS_PAGE_SIZE)

  writeOtherStarsPageSize(DEFAULT_OTHER_STARS_PAGE_SIZE)
})
