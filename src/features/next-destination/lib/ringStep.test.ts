import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JournalMission } from '@/entities/mission-store'
import { ringStep } from '@/features/next-destination/lib/ringStep'

function wing(
  missionId: string,
  from: [string, string],
  to: [string, string],
  cargo: JournalMission['cargo'],
): JournalMission {
  return {
    missionId,
    name: 'Mission_DeliveryWing_Boom',
    acceptedAt: '2026-09-10T20:00:00Z',
    detailsKnown: true,
    originSystem: from[0],
    originStation: from[1],
    destinationSystem: to[0],
    destinationStation: to[1],
    cargo,
  }
}

const HIP: [string, string] = ['HIP 11241', 'Esposito City']
const TULL: [string, string] = ['Col 285 Sector SX-B b13-2', 'Tull Reach']
const WAX: [string, string] = ['Col 285 Sector MH-M c7-5', 'Waxwizard Hub']

const shelter = wing('2', TULL, WAX, { total: 5962, collected: 3120, delivered: 3120 })

test('колец нет — блока нет', () => {
  assert.equal(ringStep([shelter]), null)
})

test('груз первого плеча в трюме — сейчас оно', () => {
  const survival = wing('1', HIP, TULL, { total: 5868, collected: 3120, delivered: 2080 })
  const step = ringStep([survival, shelter], { systemName: HIP[0], stationName: HIP[1] })

  assert.deepEqual(step?.route, ['Esposito City', 'Tull Reach', 'Waxwizard Hub', 'Esposito City'])
  assert.equal(step?.from.stationName, 'Esposito City')
  assert.equal(step?.to.stationName, 'Tull Reach')
  assert.equal(step?.emptyReturn, false)
})

test('сдал в конце цепочки — сейчас порожний перегон на склад', () => {
  const survival = wing('1', HIP, TULL, { total: 5868, collected: 3120, delivered: 3120 })
  const step = ringStep([survival, shelter], { systemName: WAX[0], stationName: WAX[1] })

  assert.equal(step?.from.stationName, 'Waxwizard Hub')
  assert.equal(step?.to.stationName, 'Esposito City')
  assert.equal(step?.emptyReturn, true)
})
