import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseStoredMissions, serializeMissions } from '@/entities/mission-store/model/validate'
import type { StoredMission } from '@/entities/mission-store/model/types'

function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  return {
    id: 'm1',
    targetSystem: 'HIP 8060',
    targetStation: 'Fernandes Base',
    addedAt: '2026-09-02T10:00:00.000Z',
    ...overrides,
  }
}

test('пустое и чужое хранилище читается как пустой список', () => {
  assert.deepEqual(parseStoredMissions(null), [])
  assert.deepEqual(parseStoredMissions({ version: 99, missions: [mission()] }), [])
  assert.deepEqual(parseStoredMissions({ version: 1, missions: 'нет' }), [])
})

test('запись переживает сериализацию', () => {
  const missions = [mission({ targetBody: 'Planet A', targetStationId: '42', completed: true })]
  const parsed = parseStoredMissions(JSON.parse(serializeMissions(missions)))

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].id, 'm1')
  assert.equal(parsed[0].targetSystem, 'HIP 8060')
  assert.equal(parsed[0].targetStation, 'Fernandes Base')
  assert.equal(parsed[0].targetBody, 'Planet A')
  assert.equal(parsed[0].targetStationId, '42')
  assert.equal(parsed[0].completed, true)
  assert.equal(parsed[0].addedAt, '2026-09-02T10:00:00.000Z')

  assert.equal(
    serializeMissions(parseStoredMissions(JSON.parse(serializeMissions(parsed)))),
    serializeMissions(parsed),
  )
})

test('одна повреждённая запись не стирает остальные', () => {
  const parsed = parseStoredMissions({
    version: 1,
    missions: [mission(), { id: 'm2', targetSystem: 'X' }, mission({ id: 'm3' })],
  })

  assert.deepEqual(
    parsed.map((entry) => entry.id),
    ['m1', 'm3'],
  )
})

test('миссия без станции не восстанавливается', () => {
  const parsed = parseStoredMissions({
    version: 1,
    missions: [{ id: 'm1', targetSystem: 'HIP 8060', addedAt: '2026-09-02T10:00:00.000Z' }],
  })

  assert.deepEqual(parsed, [])
})

test('дубль id отбрасывается', () => {
  const parsed = parseStoredMissions({
    version: 1,
    missions: [mission(), mission({ targetStation: 'Другая' })],
  })

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].targetStation, 'Fernandes Base')
})

test('пустые строки в необязательных полях не сохраняются', () => {
  const parsed = parseStoredMissions({
    version: 1,
    missions: [{ ...mission(), targetBody: '', targetStationId: '' }],
  })

  assert.equal(parsed[0].targetBody, undefined)
  assert.equal(parsed[0].targetStationId, undefined)
})
