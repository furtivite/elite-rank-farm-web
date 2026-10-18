import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'
import {
  currentLegOfCycle,
  cycleByMissionId,
  findMissionCycles,
  isOnEmptyReturn,
} from '@/entities/mission-store/lib/missionCycles'

function leg(
  missionId: string,
  from: [string, string] | null,
  to: [string, string] | null,
): JournalMission {
  return {
    missionId,
    name: 'Mission_Delivery',
    acceptedAt: '2026-09-08T18:00:00Z',
    detailsKnown: true,
    originSystem: from?.[0],
    originStation: from?.[1],
    destinationSystem: to?.[0],
    destinationStation: to?.[1],
  }
}

const A: [string, string] = ['Ngalinn', 'Hickam Survey']
const B: [string, string] = ['Mainani', 'Kirk Dock']
const C: [string, string] = ['HIP 8060', 'Archimedes City']

test('пара «туда и обратно» — это кольцо длиной два', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, A)])

  assert.equal(cycles.length, 1)
  assert.deepEqual(cycles[0].stations.map((station) => station.stationName).sort(), [
    'Hickam Survey',
    'Kirk Dock',
  ])
  assert.deepEqual(cycles[0].legs.map((item) => item.missionId).sort(), ['1', '2'])
})

test('кольцо из трёх станций находится целиком', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, C), leg('3', C, A)])

  assert.equal(cycles.length, 1)
  assert.equal(cycles[0].stations.length, 3)
  assert.deepEqual(cycles[0].legs.map((item) => item.missionId).sort(), ['1', '2', '3'])

  const legs = cycles[0].legs
  for (let index = 0; index < legs.length; index += 1) {
    const next = legs[(index + 1) % legs.length]
    assert.deepEqual(legs[index].to, next.from)
  }
})

test('несколько заданий на одном плече едут в том же кольце', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', A, B), leg('3', B, A)])

  assert.equal(cycles.length, 1)
  assert.deepEqual(cycles[0].legs.map((item) => item.missionId).sort(), ['1', '2', '3'])
})

test('незамкнутая цепочка кольцом не считается', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, C)])

  assert.deepEqual(cycles, [])
})

test('задание без происхождения в кольцо не встаёт', () => {
  const cycles = findMissionCycles([leg('1', null, B), leg('2', B, A)])

  assert.deepEqual(cycles, [])
})

test('donation-задание не образует кольца само с собой', () => {
  const cycles = findMissionCycles([leg('1', A, A), leg('2', A, A)])

  assert.deepEqual(cycles, [])
})

test('пересекающиеся кольца не делят станцию: побеждает короткое', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, A), leg('3', B, C), leg('4', C, A)])

  assert.equal(cycles.length, 1)
  assert.deepEqual(cycles[0].stations.map((station) => station.stationName).sort(), [
    'Hickam Survey',
    'Kirk Dock',
  ])
})

test('два независимых кольца находятся оба', () => {
  const D: [string, string] = ['Sol', 'Abraham Lincoln']
  const E: [string, string] = ['Wolf 359', 'Powell High']

  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, A), leg('3', D, E), leg('4', E, D)])

  assert.equal(cycles.length, 2)
})

test('порядок колец не зависит от порядка заданий в ответе сервера', () => {
  const forward = findMissionCycles([leg('1', A, B), leg('2', B, C), leg('3', C, A)])
  const shuffled = findMissionCycles([leg('3', C, A), leg('1', A, B), leg('2', B, C)])

  assert.deepEqual(
    forward.map((cycle) => cycle.id),
    shuffled.map((cycle) => cycle.id),
  )
})

test('по заданию находится его кольцо', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, A)])
  const byMission = cycleByMissionId(cycles)

  assert.equal(byMission.get('1')?.id, cycles[0].id)
  assert.equal(byMission.get('2')?.id, cycles[0].id)
  assert.equal(byMission.get('нет такого'), undefined)
})

test('следующее плечо — то, чей груз уже в трюме (114)', () => {
  const missions = [leg('1', A, B), leg('2', B, A)]
  missions[1].cargo = { total: 100, collected: 60, delivered: 0 }

  const cycles = findMissionCycles(missions)
  const current = currentLegOfCycle(cycles[0], missions, {
    systemName: 'Ngalinn',
    stationName: 'Hickam Survey',
  })

  assert.equal(current?.missionId, '2')
})

test('без груза в трюме плечо берётся от того места, где стоим', () => {
  const missions = [leg('1', A, B), leg('2', B, A)]
  const cycles = findMissionCycles(missions)

  const atA = currentLegOfCycle(cycles[0], missions, {
    systemName: 'Ngalinn',
    stationName: 'Hickam Survey',
  })
  assert.equal(atA?.missionId, '1')

  const atB = currentLegOfCycle(cycles[0], missions, {
    systemName: 'Mainani',
    stationName: 'Kirk Dock',
  })
  assert.equal(atB?.missionId, '2')
})

test('система без станции — тоже признак, но послабее', () => {
  const missions = [leg('1', A, B), leg('2', B, A)]
  const cycles = findMissionCycles(missions)

  const current = currentLegOfCycle(cycles[0], missions, { systemName: 'Mainani' })

  assert.equal(current?.missionId, '2')
})

test('когда сказать нечего, плечо всё равно названо', () => {
  const missions = [leg('1', A, B), leg('2', B, A)]
  const cycles = findMissionCycles(missions)

  assert.notEqual(currentLegOfCycle(cycles[0], missions), undefined)
})

const HIP: [string, string] = ['HIP 11241', 'Esposito City']
const TULL: [string, string] = ['Col 285 Sector SX-B b13-2', 'Tull Reach']
const WAX: [string, string] = ['Col 285 Sector MH-M c7-5', 'Waxwizard Hub']

function wing(
  missionId: string,
  from: [string, string],
  to: [string, string],
  cargo: JournalMission['cargo'],
): JournalMission {
  return { ...leg(missionId, from, to), name: 'Mission_DeliveryWing_Boom', cargo }
}

const survival = wing('1065675014', HIP, TULL, { total: 5868, collected: 3120, delivered: 2080 })
const shelter = wing('1065668823', TULL, WAX, { total: 5962, collected: 3120, delivered: 3120 })

test('цепочка грузовых заданий замыкается возвратом на склад (114.1)', () => {
  const cycles = findMissionCycles([shelter, survival])

  assert.equal(cycles.length, 1)
  assert.equal(cycles[0].emptyReturn, true)
  assert.deepEqual(
    cycles[0].stations.map((station) => station.stationName),
    ['Esposito City', 'Tull Reach', 'Waxwizard Hub'],
  )
  assert.deepEqual(
    cycles[0].legs.map((item) => item.missionId),
    ['1065675014', '1065668823'],
  )
})

test('склад первого задания пуст — возвращаться незачем, кольца нет', () => {
  const lastRun = { ...survival, cargo: { total: 5868, collected: 5868, delivered: 4828 } }

  assert.deepEqual(findMissionCycles([lastRun, shelter]), [])
})

test('курьерские задания цепочки не образуют', () => {
  assert.deepEqual(findMissionCycles([leg('1', A, B), leg('2', B, C)]), [])
})

test('в трюме груз первого плеча — оно и текущее', () => {
  const missions = [survival, shelter]
  const cycles = findMissionCycles(missions)
  const position = { systemName: 'HIP 11241', stationName: 'Esposito City' }

  assert.equal(currentLegOfCycle(cycles[0], missions, position)?.missionId, '1065675014')
  assert.equal(isOnEmptyReturn(cycles[0], missions, position), false)
})

test('сдал в конце цепочки, трюм пуст — идёт порожний перегон', () => {
  const emptied = { ...survival, cargo: { total: 5868, collected: 3120, delivered: 3120 } }
  const missions = [emptied, shelter]
  const cycles = findMissionCycles(missions)

  assert.equal(
    isOnEmptyReturn(cycles[0], missions, {
      systemName: 'Col 285 Sector MH-M c7-5',
      stationName: 'Waxwizard Hub',
    }),
    true,
  )
})

test('у настоящего кольца порожнего перегона нет', () => {
  const cycles = findMissionCycles([leg('1', A, B), leg('2', B, A)])

  assert.equal(cycles[0].emptyReturn, false)
})
