import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blockedInBasketSystems } from '@/widgets/mission-basket/lib/blockedInBasketSystems'
import type { BlockedBase } from '@/features/blocked-bases'
import type { MissionSystemGroup } from '@/entities/mission-store'

function base(systemName: string, stationName: string): BlockedBase {
  return {
    station: { id: stationName, systemId: systemName, name: stationName },
    systemName,
  } as unknown as BlockedBase
}

function group(systemName: string): MissionSystemGroup {
  return { systemName } as unknown as MissionSystemGroup
}

test('база из системы со взятым заданием показывается', () => {
  const result = blockedInBasketSystems([base('Ngalinn', 'Hickam Survey')], [group('Ngalinn')])

  assert.equal(result.length, 1)
})

test('база из чужой системы не показывается', () => {
  const result = blockedInBasketSystems([base('Canopus', 'Whatever')], [group('Ngalinn')])

  assert.deepEqual(result, [])
})

test('пустая корзина не показывает ни одной базы', () => {
  const result = blockedInBasketSystems([base('Ngalinn', 'Hickam Survey')], [])

  assert.deepEqual(result, [])
})

test('имя системы сравнивается терпимо к пробелам и регистру', () => {
  const result = blockedInBasketSystems(
    [base('  col 285   sector  tx-b b13-3 ', 'Midgard')],
    [group('Col 285 Sector TX-B b13-3')],
  )

  assert.equal(result.length, 1)
})
