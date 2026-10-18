import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parseJournalMissions } from '@/entities/mission-store/model/journalTypes'

test('каждое обязательное поле задания из схемы и правда обязательно', () => {
  const required: string[] =
    JSON.parse(readFileSync('contracts/active-missions.schema.json', 'utf8')).$defs.mission
      .required ?? []
  assert.ok(required.length > 0)

  const mission = {
    missionId: '1064725259',
    name: 'Mission_Courier_RankFed',
    acceptedAt: '2026-09-06T09:31:08Z',
    detailsKnown: true,
  }

  assert.notEqual(parseJournalMissions({ missions: [mission] }), null)

  for (const field of required) {
    const broken: Record<string, unknown> = { ...mission }
    delete broken[field]

    assert.equal(
      parseJournalMissions({ missions: [broken] }),
      null,
      `без ${field} список заданий должен отвергаться целиком`,
    )
  }
})

test('станция взятия доезжает из ответа сервера (114)', () => {
  const withOrigin = parseJournalMissions({
    missions: [
      {
        missionId: '1064725259',
        name: 'Mission_Delivery',
        acceptedAt: '2026-09-06T09:31:08Z',
        detailsKnown: true,
        originSystem: 'Ngalinn',
        originStation: 'Hickam Survey',
        destinationSystem: 'Mainani',
        destinationStation: 'Kirk Dock',
      },
    ],
  })

  assert.equal(withOrigin?.[0].originSystem, 'Ngalinn')
  assert.equal(withOrigin?.[0].originStation, 'Hickam Survey')

  const withoutOrigin = parseJournalMissions({
    missions: [
      {
        missionId: '1064725259',
        name: 'Mission_Delivery',
        acceptedAt: '2026-09-06T09:31:08Z',
        detailsKnown: true,
      },
    ],
  })

  assert.equal(withoutOrigin?.[0].originSystem, undefined)
})
