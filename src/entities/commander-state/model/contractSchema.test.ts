import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseCommanderStateResponse } from '@/entities/commander-state/model/validate'

function schema(name: string): { required?: string[] } {
  return JSON.parse(readFileSync(`contracts/${name}.schema.json`, 'utf8'))
}

function validState(): Record<string, unknown> {
  return {
    schemaVersion: 4,
    commanderName: 'CMDR',
    currentSystem: { name: 'Ngalinn', x: 8.625, y: -219.84375, z: -60.84375 },
    currentStation: 'Hickam Survey',
    currentBody: null,
    ship: 'python',
    requiredPadSize: 'L',
    jumpRangeLy: 42,
    imperialRank: 8,
    imperialProgress: 64,
    imperialProgressAt: '2026-09-06T09:00:00Z',
    federalRank: 2,
    federalProgress: 100,
    federalProgressAt: '2026-09-06T09:00:00Z',
    observedAt: '2026-09-06T12:00:00Z',
  }
}

function validResponse(state: Record<string, unknown> = validState()): Record<string, unknown> {
  return { status: 'ok', state, updatedAt: '2026-09-06T12:00:05Z' }
}

test('заведомо годный ответ проходит — иначе проверки ниже бессмысленны', () => {
  assert.notEqual(parseCommanderStateResponse(validResponse()), null)
})

test('каждое обязательное поле состояния из схемы и правда обязательно', () => {
  const required = schema('commander-state').required ?? []
  assert.ok(required.length > 0, 'схема без required — значит прочитали не то')

  for (const field of required) {
    const state = validState()
    delete state[field]

    assert.equal(
      parseCommanderStateResponse(validResponse(state)),
      null,
      `без ${field} ответ должен отвергаться: схема считает поле обязательным`,
    )
  }
})

test('каждое обязательное поле ответа из схемы и правда обязательно', () => {
  const required = schema('commander-state-response').required ?? []
  assert.ok(required.length > 0)

  for (const field of required) {
    const response = validResponse()
    delete response[field]

    assert.equal(
      parseCommanderStateResponse(response),
      null,
      `без ${field} ответ должен отвергаться`,
    )
  }
})

test('presence принимает ровно те значения, что перечислены в схеме', () => {
  const presence: string[] = JSON.parse(
    readFileSync('contracts/commander-state.schema.json', 'utf8'),
  ).properties.presence.properties.status.enum
  assert.ok(presence.length > 0)

  for (const status of presence) {
    const state = { ...validState(), presence: { status, at: '2026-09-06T11:00:00Z' } }
    const parsed = parseCommanderStateResponse(validResponse(state))

    assert.equal(
      parsed?.state.presence?.status,
      status,
      `${status} перечислен в схеме, но не принят`,
    )
  }

  const state = { ...validState(), presence: { status: 'flying', at: '2026-09-06T11:00:00Z' } }
  assert.equal(parseCommanderStateResponse(validResponse(state))?.state.presence, undefined)
})
