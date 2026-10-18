import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeMissions } from '@/entities/mission-store/lib/mergeMissions'
import type { StoredMission } from '@/entities/mission-store/model/types'

function mission(id: string, overrides: Partial<StoredMission> = {}): StoredMission {
  return {
    id,
    targetSystem: 'Ngalinn',
    targetStation: 'Hickam Survey',
    addedAt: `2026-09-15T10:0${id.slice(-1)}:00.000Z`,
    ...overrides,
  }
}

test('объединение по id: ничего не теряется (45.6)', () => {
  const merged = mergeMissions([mission('m1'), mission('m2')], [mission('m3')])

  assert.deepEqual(
    merged.map((item) => item.id),
    ['m1', 'm2', 'm3'],
  )
})

test('по совпавшему id побеждает первая копия — та, что в этом браузере', () => {
  const merged = mergeMissions(
    [mission('m1', { completed: true })],
    [mission('m1', { completed: undefined, note: 'со старого устройства' })],
  )

  assert.equal(merged.length, 1)
  assert.equal(merged[0]?.completed, true)
  assert.equal(merged[0]?.note, undefined)
})

test('два задания на одну станцию остаются двумя', () => {
  const merged = mergeMissions([mission('m1')], [mission('m2')])

  assert.equal(merged.length, 2)
})

test('порядок — по времени добавления, а не по тому, чья копия пришла первой', () => {
  const merged = mergeMissions(
    [mission('m3', { addedAt: '2026-09-15T12:00:00.000Z' })],
    [mission('m1', { addedAt: '2026-09-15T09:00:00.000Z' })],
  )

  assert.deepEqual(
    merged.map((item) => item.id),
    ['m1', 'm3'],
  )
})

test('пустая сторона ничего не меняет', () => {
  const list = [mission('m1')]

  assert.deepEqual(mergeMissions(list, []), list)
  assert.deepEqual(mergeMissions([], list), list)
})
