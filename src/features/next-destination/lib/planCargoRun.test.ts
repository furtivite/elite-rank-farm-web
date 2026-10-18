import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JournalMission, MissionCargo } from '@/entities/mission-store'
import { planCargoRun } from '@/features/next-destination/lib/planCargoRun'

function mission(cargo: MissionCargo | undefined, id = '1'): JournalMission {
  return {
    missionId: id,
    name: 'Mission_Delivery',
    destinationSystem: 'HIP 20527',
    destinationStation: 'Bray Cultivation',
    acceptedAt: '2026-09-09T06:00:00Z',
    detailsKnown: true,
    cargo,
  }
}

const atWarehouse: MissionCargo = {
  commodity: 'foodcartridges',
  commodityLocalised: 'Пищевые брикеты',
  total: 60,
  delivered: 24,
  collected: 24,
  sourceSystem: 'Ngalinn',
  sourceStation: 'Sanger Terminal',
}

test('трюм пуст, остаток на складе — цель склад', () => {
  const plan = planCargoRun([mission(atWarehouse)])

  assert.notEqual(plan, null)
  assert.equal(plan?.pickup.systemName, 'Ngalinn')
  assert.equal(plan?.pickup.stationName, 'Sanger Terminal')
  assert.equal(plan?.pickup.remaining, 36)
  assert.deepEqual(plan?.pickup.commodities, ['Пищевые брикеты'])
})

test('груз задания в трюме — цель прежняя, станция сдачи', () => {
  const plan = planCargoRun([mission({ ...atWarehouse, collected: 36 })])

  assert.equal(plan, null)
})

test('есть задание без груза — правило не применяется', () => {
  const plan = planCargoRun([mission(atWarehouse), mission(undefined, '2')])

  assert.equal(plan, null)
})

test('грузовое довезено целиком — оно тоже ждёт сдачи', () => {
  const plan = planCargoRun([
    mission(atWarehouse),
    mission({ ...atWarehouse, delivered: 60, collected: 60 }, '2'),
  ])

  assert.equal(plan, null)
})

test('склад неизвестен — молчим, а не показываем идентификатор', () => {
  const plan = planCargoRun([mission({ total: 60, delivered: 0, collected: 0, commodity: 'gold' })])

  assert.equal(plan, null)
})

test('wing-задание до первого взятия зовёт на станцию, где взято', () => {
  const untouched: JournalMission = {
    ...mission({ total: 5868, commodityLocalised: 'Снаряжение для выживания' }),
    name: 'Mission_DeliveryWing_Boom',
    originSystem: 'HIP 11241',
    originStation: 'Esposito City',
  }

  const plan = planCargoRun([untouched])

  assert.equal(plan?.pickup.systemName, 'HIP 11241')
  assert.equal(plan?.pickup.stationName, 'Esposito City')
  assert.equal(plan?.pickup.remaining, 5868)
})

test('два задания с одного склада складываются в одну цель', () => {
  const plan = planCargoRun([
    mission(atWarehouse),
    mission(
      { ...atWarehouse, commodityLocalised: 'Титан', total: 40, delivered: 10, collected: 10 },
      '2',
    ),
  ])

  assert.equal(plan?.pickup.remaining, 66)
  assert.equal(plan?.pickup.missions, 2)
  assert.deepEqual(plan?.pickup.commodities, ['Пищевые брикеты', 'Титан'])
})

test('складов несколько — выбирается тот, где лежит больше', () => {
  const plan = planCargoRun([
    mission(atWarehouse),
    mission(
      {
        ...atWarehouse,
        total: 200,
        delivered: 0,
        collected: 0,
        sourceSystem: 'Canopus',
        sourceStation: 'Hickam Survey',
      },
      '2',
    ),
  ])

  assert.equal(plan?.pickup.stationName, 'Hickam Survey')
  assert.equal(plan?.pickup.remaining, 200)
})

test('потерянное вместе с кораблём возвращается на склад, а не в трюм', () => {
  const plan = planCargoRun([mission({ ...atWarehouse, collected: 60, delivered: 24, lost: 36 })])

  assert.equal(plan?.pickup.remaining, 36, 'везти всё ещё 36')
})

test('пустая корзина — предлагать нечего', () => {
  assert.equal(planCargoRun([]), null)
})

function handover(id: string, system: string, station: string): JournalMission {
  return {
    missionId: id,
    name: 'Mission_Courier',
    destinationSystem: system,
    destinationStation: station,
    acceptedAt: '2026-09-09T06:00:00Z',
    detailsKnown: true,
  }
}

test('задание, которое сдаётся здесь, становится второй целью', () => {
  const plan = planCargoRun([mission(atWarehouse), handover('2', 'Sol', 'Abraham Lincoln')], {
    currentSystemName: 'Sol',
  })

  assert.equal(plan?.pickup.stationName, 'Sanger Terminal')
  assert.equal(plan?.local?.stationName, 'Abraham Lincoln')
  assert.equal(plan?.shuttle, false, 'одного перелёта для челнока мало')
})

test('задание, которое сдаётся в третьей системе, отменяет правило', () => {
  const plan = planCargoRun([mission(atWarehouse), handover('2', 'Canopus', 'Hickam Survey')], {
    currentSystemName: 'Sol',
  })

  assert.equal(plan, null)
})

test('возвращение к складу и обратно включает режим челнока', () => {
  const history = [
    { systemName: 'Sol', at: '2026-09-09T11:00:00Z' },
    { systemName: 'Ngalinn', at: '2026-09-09T10:30:00Z' },
    { systemName: 'Sol', at: '2026-09-09T10:00:00Z' },
  ]

  const plan = planCargoRun([mission(atWarehouse), handover('2', 'Sol', 'Abraham Lincoln')], {
    currentSystemName: 'Sol',
    history,
  })

  assert.equal(plan?.shuttle, true)
})

test('несколько местных заданий сводятся к станции, где их больше', () => {
  const plan = planCargoRun(
    [
      mission(atWarehouse),
      handover('2', 'Sol', 'Abraham Lincoln'),
      handover('3', 'Sol', 'Abraham Lincoln'),
      handover('4', 'Sol', 'Galileo'),
    ],
    { currentSystemName: 'Sol' },
  )

  assert.equal(plan?.local?.stationName, 'Abraham Lincoln')
  assert.equal(plan?.local?.missions, 2)
})
