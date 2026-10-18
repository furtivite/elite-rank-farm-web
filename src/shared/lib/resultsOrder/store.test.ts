import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_RESULTS_ORDER } from '@/shared/lib/resultsOrder'

test('по умолчанию выдача идёт от ближних систем', () => {
  assert.equal(DEFAULT_RESULTS_ORDER, 'nearest')
})
