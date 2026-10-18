import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  _resetPinStoreForTests,
  getPinSnapshot,
  writePin,
} from '@/features/next-destination/model/pinStore'
import { NEXT_DESTINATION_PIN_STORAGE_KEY } from '@/shared/config/storageKeys'
import { _resetDemoSandboxForTests, setDemoSandboxActive } from '@/shared/lib/demoSandbox'

const saved: Record<string, string> = {}

;(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => saved[key] ?? null,
  setItem: (key: string, value: string) => {
    saved[key] = value
  },
  removeItem: (key: string) => {
    delete saved[key]
  },
}
;(globalThis as { window?: unknown }).window = globalThis

const REAL = { systemKey: 'real', stationKey: null }

beforeEach(() => {
  for (const key of Object.keys(saved)) {
    delete saved[key]
  }
  saved[NEXT_DESTINATION_PIN_STORAGE_KEY] = JSON.stringify(REAL)
  _resetDemoSandboxForTests()
  _resetPinStoreForTests()
})

test('снятие закрепления в показе не трогает настоящее', () => {
  setDemoSandboxActive(true)
  assert.deepEqual(getPinSnapshot(), REAL)

  writePin(null)
  assert.equal(getPinSnapshot(), null)
  assert.equal(saved[NEXT_DESTINATION_PIN_STORAGE_KEY], JSON.stringify(REAL))
})

test('показ кончился — настоящее закрепление на месте', () => {
  setDemoSandboxActive(true)
  writePin({ systemKey: 'demo', stationKey: null })
  setDemoSandboxActive(false)

  assert.deepEqual(getPinSnapshot(), REAL)
})
