import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getServerManualMissionSettings } from '@/entities/mission-store/model/manualSettings'

test('умолчания: добавлять руками можно, ручные считаются (70.3, 70.9)', () => {
  assert.deepEqual(getServerManualMissionSettings(), {
    addManually: true,
    excludeFromCount: false,
  })
})
