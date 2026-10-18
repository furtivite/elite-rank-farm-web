import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readMissionsFile } from '@/features/mission-file/lib/readMissionsFile'
import { serializeMissionsForExport } from '@/entities/mission-store'
import type { StoredMission } from '@/entities/mission-store'

function file(text: string) {
  return { text: async () => text }
}

const mission: StoredMission = {
  id: 'm1',
  targetSystem: 'Ngalinn',
  targetStation: 'Hickam Survey',
  addedAt: '2026-09-03T10:00:00.000Z',
}

test('сохранённое читается обратно', () => {
  return readMissionsFile(file(serializeMissionsForExport([mission]))).then((result) => {
    assert.equal(result.status, 'ok')
    assert.equal(result.status === 'ok' && result.missions.length, 1)
    assert.equal(result.status === 'ok' && result.missions[0].targetSystem, 'Ngalinn')
  })
})

test('не JSON — «не разобралось», а не пустая корзина', async () => {
  const result = await readMissionsFile(file('это не json'))

  assert.equal(result.status, 'invalid')
})

test('обрезанный файл тоже «не разобралось»', async () => {
  const result = await readMissionsFile(file('{"version":1,"missions":[{"id":'))

  assert.equal(result.status, 'invalid')
})

test('разобралось, но заданий нет — отдельный ответ', async () => {
  const result = await readMissionsFile(file(serializeMissionsForExport([])))

  assert.equal(result.status, 'empty')
})

test('чужой JSON правильной формы, но без заданий — тоже пусто', async () => {
  const result = await readMissionsFile(file('{"foo":"bar"}'))

  assert.equal(result.status, 'empty')
})

test('мусор среди записей не уносит годные', async () => {
  const raw = JSON.parse(serializeMissionsForExport([mission])) as Record<string, unknown>
  const missions = raw.missions as unknown[]
  missions.push({ id: 42 })

  const result = await readMissionsFile(file(JSON.stringify(raw)))

  assert.equal(result.status, 'ok')
  assert.equal(result.status === 'ok' && result.missions.length, 1)
})
