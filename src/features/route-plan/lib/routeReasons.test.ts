import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  groupMissions,
  returnLegKey,
  type JournalMission,
  type StoredMission,
} from '@/entities/mission-store'
import {
  cargoTonsBySystem,
  cargoTonsOf,
  hasReturnLegInBasket,
  hasUncollectedDepot,
} from '@/features/route-plan/lib/routeReasons'

function journal(id: string, cargo?: JournalMission['cargo'], system = 'Ngalinn'): JournalMission {
  return {
    missionId: id,
    name: 'Mission_Delivery_RankEmp',
    destinationSystem: system,
    destinationStation: 'База',
    acceptedAt: '2026-09-16T06:00:00.000Z',
    detailsKnown: true,
    cargo,
  }
}

function stored(system: string, station: string): StoredMission {
  return {
    id: `${system}-${station}`,
    targetSystem: system,
    targetSystemId: system,
    targetStation: station,
    addedAt: '2026-09-16T06:00:00.000Z',
  }
}

test('склад недобран — есть зачем строить маршрут (18.4)', () => {
  assert.equal(hasUncollectedDepot([journal('1', { total: 20, collected: 8 })]), true)
  assert.equal(hasUncollectedDepot([journal('1', { total: 20, collected: 20 })]), false)
})

test('задание без склада возвращаться не заставляет (18.4)', () => {
  assert.equal(hasUncollectedDepot([journal('1', { total: 6 })]), false)
  assert.equal(hasUncollectedDepot([journal('1')]), false)
})

test('пометка «возвратная» считается по станциям корзины (18.4)', () => {
  const groups = groupMissions([stored('Ngalinn', 'База')])
  const legs = { [returnLegKey('Ngalinn', 'База')]: { systemName: 'Canopus', stationName: 'Дом' } }

  assert.equal(hasReturnLegInBasket(groups, legs), true)
  assert.equal(
    hasReturnLegInBasket(groups, {
      [returnLegKey('Иная', 'База')]: legs[returnLegKey('Ngalinn', 'База')]!,
    }),
    false,
  )
})

test('тонны складываются по системе, сданное не считается (18.6)', () => {
  const tons = cargoTonsBySystem([
    journal('1', { total: 20, delivered: 5 }),
    journal('2', { total: 4 }),
    journal('3', { total: 10, delivered: 10 }),
    journal('4', { total: 7 }, 'Mainani'),
  ])

  assert.equal(cargoTonsOf('Ngalinn', tons), 19)
  assert.equal(cargoTonsOf('Mainani', tons), 7)
})

test('имя системы сравнивается без регистра и краевых пробелов', () => {
  const tons = cargoTonsBySystem([journal('1', { total: 3 }, ' NGALINN ')])

  assert.equal(cargoTonsOf('Ngalinn', tons), 3)
  assert.equal(cargoTonsOf('Ngalinn', undefined), 0)
})
