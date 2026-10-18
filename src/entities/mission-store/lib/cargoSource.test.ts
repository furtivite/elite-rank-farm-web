import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cargoSource } from '@/entities/mission-store/lib/cargoSource'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'

const UNTOUCHED_WING: JournalMission = {
  missionId: '1065675014',
  name: 'Mission_DeliveryWing_Boom',
  destinationSystem: 'Col 285 Sector SX-B b13-2',
  destinationStation: 'Tull Reach',
  originSystem: 'HIP 11241',
  originStation: 'Esposito City',
  acceptedAt: '2026-09-10T21:20:19Z',
  detailsKnown: true,
  cargo: { commodityLocalised: 'Снаряжение для выживания', total: 5868 },
}

test('склад, названный сервером, важнее станции взятия', () => {
  const named: JournalMission = {
    ...UNTOUCHED_WING,
    cargo: { ...UNTOUCHED_WING.cargo!, sourceSystem: 'Ngalinn', sourceStation: 'Gloss Gateway' },
  }

  assert.deepEqual(cargoSource(named), { systemName: 'Ngalinn', stationName: 'Gloss Gateway' })
})

test('склад ещё не тронут — у wing-задания это станция взятия', () => {
  assert.deepEqual(cargoSource(UNTOUCHED_WING), {
    systemName: 'HIP 11241',
    stationName: 'Esposito City',
  })
})

test('обычная доставка на станцию взятия не ссылается: груз выдан в трюм', () => {
  assert.equal(cargoSource({ ...UNTOUCHED_WING, name: 'Mission_Delivery' }), null)
})

test('станция взятия неизвестна — склада нет, а не выдуманный', () => {
  const noOrigin: JournalMission = {
    ...UNTOUCHED_WING,
    originSystem: undefined,
    originStation: undefined,
  }

  assert.equal(cargoSource(noOrigin), null)
})

test('у задания без груза склада нет', () => {
  assert.equal(cargoSource({ ...UNTOUCHED_WING, cargo: undefined }), null)
})
