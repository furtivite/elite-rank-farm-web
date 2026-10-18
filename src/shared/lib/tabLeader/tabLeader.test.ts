import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LEADER_STALE_MS, shouldClaim } from '@/shared/lib/tabLeader'

const NOW = 1_800_000_000_000

test('роли нет — берём себе', () => {
  assert.equal(shouldClaim(null, 'мы', NOW), true)
})

test('роль наша — подтверждаем', () => {
  assert.equal(shouldClaim({ id: 'мы', at: NOW - 5_000 }, 'мы', NOW), true)
})

test('чужая свежая роль — молчим', () => {
  assert.equal(shouldClaim({ id: 'сосед', at: NOW - 5_000 }, 'мы', NOW), false)
})

test('чужая протухшая роль — перехватываем', () => {
  assert.equal(shouldClaim({ id: 'сосед', at: NOW - LEADER_STALE_MS }, 'мы', NOW), true)
})

test('порог с запасом: одного пропущенного тика мало', () => {
  assert.ok(LEADER_STALE_MS >= 3 * 10_000)
  assert.equal(shouldClaim({ id: 'сосед', at: NOW - 11_000 }, 'мы', NOW), false)
})
