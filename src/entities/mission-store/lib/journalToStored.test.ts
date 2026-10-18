import assert from 'node:assert/strict'
import { test } from 'node:test'
import { awaitsCargo } from '@/entities/mission-store/lib/cargoProgress'
import { journalToStored } from '@/entities/mission-store/lib/journalToStored'
import { parseJournalMissions } from '@/entities/mission-store/model/journalTypes'

const COLLECT = {
  missionId: '1065842158',
  name: 'Mission_Collect_Industrial',
  destinationSystem: 'Col 285 Sector VD-A b14-1',
  destinationStation: 'Bede Sanctuary',
  acceptedAt: '2026-09-12T20:16:10Z',
  detailsKnown: true,
  cargo: { commodity: '$Tritium_Name;', total: 490, inHold: 120 },
}

test('inHold доезжает из ответа сервера до задания корзины (70.6)', () => {
  const parsed = parseJournalMissions({ missions: [COLLECT] })
  assert.ok(parsed)
  assert.equal(parsed[0].cargo?.inHold, 120)
  assert.equal(journalToStored(parsed[0])?.awaitingCargo, true)
})

test('без inHold — флаг выключен или сборка старше — задание зовёт, как раньше', () => {
  const parsed = parseJournalMissions({
    missions: [{ ...COLLECT, cargo: { commodity: '$Tritium_Name;', total: 490 } }],
  })
  assert.ok(parsed)
  assert.equal(journalToStored(parsed[0])?.awaitingCargo, undefined)
})

test('набрано всё нужное — задание готово к сдаче', () => {
  assert.equal(awaitsCargo({ total: 490, inHold: 490 }), false)
  assert.equal(awaitsCargo({ total: 490, inHold: 489 }), true)
  assert.equal(awaitsCargo({ total: 490 }), false)
})
