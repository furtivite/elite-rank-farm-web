import assert from 'node:assert/strict'
import test from 'node:test'

import { groupMissions } from '@/entities/mission-store/lib/groupMissions'
import {
  applySnapshotOrder,
  pinCurrentPosition,
  snapshotOrder,
} from '@/entities/mission-store/lib/orderMissions'
import type { StoredMission } from '@/entities/mission-store/model/types'

let counter = 0

function mission(systemName: string, stationName: string, bodyName?: string): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: systemName,
    targetStation: stationName,
    targetBody: bodyName,
    addedAt: '2026-09-02T00:00:00.000Z',
  }
}

const missions: StoredMission[] = [
  mission('Ngalinn', 'Hickam Survey'),
  mission('Ngalinn', 'Hickam Survey'),
  mission('Ngalinn', 'Vonarburg Orbital'),
  mission('Sirius', 'Patterson Enterprise'),
]

function names(groups: ReturnType<typeof groupMissions>) {
  return groups.map((system) => system.systemName)
}

test('без позиции порядок не трогается', () => {
  const natural = groupMissions(missions)
  assert.deepEqual(names(pinCurrentPosition(natural, null)), names(natural))
})

test('система, где находится командир, идёт первой', () => {
  const groups = pinCurrentPosition(groupMissions(missions), {
    systemName: 'Sirius',
    stationName: null,
  })
  assert.deepEqual(names(groups), ['Sirius', 'Ngalinn'])
})

test('станция стыковки поднимается внутри своей системы', () => {
  const groups = pinCurrentPosition(groupMissions(missions), {
    systemName: 'ngalinn',
    stationName: ' vonarburg orbital ',
  })

  assert.equal(groups[0].systemName, 'Ngalinn')
  const stations = groups[0].bodies.flatMap((body) =>
    body.stations.map((station) => station.stationName),
  )
  assert.equal(stations[0], 'Vonarburg Orbital')
})

test('позиция вне корзины ничего не ломает', () => {
  const natural = groupMissions(missions)
  const groups = pinCurrentPosition(natural, {
    systemName: 'Colonia',
    stationName: 'Jaques Station',
  })
  assert.deepEqual(names(groups), names(natural))
})

test('замороженный порядок переживает удаление миссии', () => {
  const natural = groupMissions(missions)
  const snapshot = snapshotOrder(natural)

  const afterDelete = groupMissions(missions.filter((m) => m.targetStation !== 'Hickam Survey'))
  assert.deepEqual(names(afterDelete), ['Ngalinn', 'Sirius'])

  const frozen = applySnapshotOrder(afterDelete, snapshot)
  assert.deepEqual(names(frozen), ['Ngalinn', 'Sirius'])
  assert.equal(
    frozen[0].bodies.flatMap((body) => body.stations).length,
    1,
    'удалённая станция из списка исчезла, а не осталась ради порядка',
  )
})

test('появившееся после снимка встаёт в конец, а не в середину', () => {
  const snapshot = snapshotOrder(groupMissions(missions))
  const withNew = groupMissions([...missions, mission('Achenar', 'Dawes Hub')])

  const frozen = applySnapshotOrder(withNew, snapshot)
  assert.deepEqual(names(frozen), ['Ngalinn', 'Sirius', 'Achenar'])
})
