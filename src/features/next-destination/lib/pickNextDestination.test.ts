import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import { estimateJumps } from '@/entities/galaxy-data'
import { groupMissions } from '@/entities/mission-store'
import type { StoredMission } from '@/entities/mission-store'
import { pickNextDestination } from '@/features/next-destination/lib/pickNextDestination'

const ru = createTranslate('ru')

let counter = 0

function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: 'HIP 8060',
    targetStation: 'Fernandes Base',
    addedAt: `2026-09-03T10:00:0${counter % 10}.000Z`,
    ...overrides,
  }
}

function labels(reasons: ReadonlyArray<{ label: string }>): string[] {
  return reasons.map((reason) => reason.label)
}

test('число миссий склоняется по-русски, а не «2 миссий»', () => {
  const groups = groupMissions([mission(), mission()])
  const one = groupMissions([mission()])
  const five = groupMissions([mission(), mission(), mission(), mission(), mission()])

  assert.ok(labels(pickNextDestination(groups, ru)!.reasons).includes('2 миссии в системе'))
  assert.ok(labels(pickNextDestination(one, ru)!.reasons).includes('1 миссия в системе'))
  assert.ok(labels(pickNextDestination(five, ru)!.reasons).includes('5 миссий в системе'))
})

test('пустая корзина — рекомендовать нечего', () => {
  assert.equal(pickNextDestination(groupMissions([]), ru), null)
})

test('берёт первую систему в порядке корзины, а не считает свой счёт', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Одна', targetStation: 'A' }),
    mission({ targetSystem: 'Три', targetStation: 'B' }),
    mission({ targetSystem: 'Три', targetStation: 'B' }),
    mission({ targetSystem: 'Три', targetStation: 'B' }),
  ])

  const destination = pickNextDestination(groups, ru)

  assert.ok(destination)
  assert.equal(destination.systemName, 'Три')
  assert.equal(destination.stationName, 'B')
  assert.equal(destination.missionsInSystem, 3)
  assert.equal(destination.missionsAtStation, 3)
})

test('внутри системы выбирает станцию с большим числом миссий', () => {
  const groups = groupMissions([
    mission({ targetBody: 'Planet A', targetStation: 'Одна миссия' }),
    mission({ targetBody: 'Planet B', targetStation: 'Две миссии' }),
    mission({ targetBody: 'Planet B', targetStation: 'Две миссии' }),
  ])

  const destination = pickNextDestination(groups, ru)

  assert.equal(destination?.stationName, 'Две миссии')
  assert.equal(destination?.bodyName, 'Planet B')
})

test('при равном числе миссий выбирает ближнюю по supercruise (16.7)', () => {
  const groups = groupMissions([
    mission({ targetStation: 'Далёкая', targetStationId: 'far' }),
    mission({ targetStation: 'Ближняя', targetStationId: 'near' }),
  ])

  const destination = pickNextDestination(groups, ru, {
    stationFacts: new Map([
      ['far', { distanceToArrivalLs: 4200 }],
      ['near', { distanceToArrivalLs: 180 }],
    ]),
  })

  assert.equal(destination?.stationName, 'Ближняя')
  assert.ok(labels(destination!.reasons).includes('180\u00a0св.\u00a0с. до станции'))
})

test('станция в чёрном списке не исключается, а помечается (14.6, 12)', () => {
  const groups = groupMissions([mission({ targetStationId: 'blocked-station' })])

  const destination = pickNextDestination(groups, ru, {
    ratings: {
      'blocked-station': { rating: 'blocked', updatedAt: '2026-09-03T10:00:00.000Z' },
    },
  })

  assert.ok(destination)
  assert.equal(destination.stationName, 'Fernandes Base')
  const blockedReason = destination.reasons.find((reason) => reason.caution === true)
  assert.equal(blockedReason?.label, 'в чёрном списке, но миссия сюда уже принята')
})

test('размер пада показывается, но ничего не исключает (14.6)', () => {
  const groups = groupMissions([mission({ targetStationId: 'small-pad' })])

  const destination = pickNextDestination(groups, ru, {
    stationFacts: new Map([['small-pad', { maxPadSize: 'S' as const }]]),
  })

  assert.equal(destination?.stationName, 'Fernandes Base')
  assert.ok(labels(destination!.reasons).includes('площадка S'))
})

test('закреплённая система побеждает порядок корзины (18)', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Одна', targetSystemId: 'one', targetStation: 'A' }),
    mission({ targetSystem: 'Три', targetSystemId: 'three', targetStation: 'B' }),
    mission({ targetSystem: 'Три', targetSystemId: 'three', targetStation: 'B' }),
    mission({ targetSystem: 'Три', targetSystemId: 'three', targetStation: 'B' }),
  ])

  const destination = pickNextDestination(groups, ru, {
    pinned: { systemKey: 'one', stationKey: null },
  })

  assert.equal(destination?.systemName, 'Одна')
  assert.equal(destination?.isPinned, true)
  assert.ok(labels(destination!.reasons).includes('закреплено вручную'))
})

test('закрепление на исчезнувшую систему не ломает подсказку', () => {
  const groups = groupMissions([mission({ targetSystem: 'Одна', targetSystemId: 'one' })])

  const destination = pickNextDestination(groups, ru, {
    pinned: { systemKey: 'удалённая', stationKey: null },
  })

  assert.equal(destination?.systemName, 'Одна')
  assert.equal(destination?.isPinned, false)
})

test('выполненные миссии называются отдельно — их можно сдать', () => {
  const groups = groupMissions([
    mission({ completed: true }),
    mission({ completed: true }),
    mission(),
  ])

  const destination = pickNextDestination(groups, ru)

  assert.equal(destination?.completedAtStation, 2)
  assert.ok(labels(destination!.reasons).includes('2 выполнено — можно сдать'))
})

test('стоянка на месте вытесняет расстояние из причин', () => {
  const groups = groupMissions([mission({ targetSystem: 'HIP 8060' })])

  const docked = pickNextDestination(groups, ru, {
    currentSystemName: 'hip 8060',
    currentStationName: 'fernandes base',
  })
  assert.ok(labels(docked!.reasons).includes('вы уже пристыкованы здесь'))

  const inSystem = pickNextDestination(groups, ru, {
    currentSystemName: 'HIP 8060',
    currentStationName: null,
  })
  assert.ok(labels(inSystem!.reasons).includes('вы уже в этой системе'))
})

test('«вы уже здесь» определяется координатами, а не написанием имени (59.4)', () => {
  const here = estimateJumps({ x: 10, y: 20, z: 30 }, { x: 10, y: 20, z: 30 }, 30)
  assert.ok(here)

  const groups = groupMissions([mission({ targetSystem: 'HIP 8060', targetSystemId: 'here' })], {
    jumps: new Map([['here', here]]),
  })

  const destination = pickNextDestination(groups, ru, { currentSystemName: 'hip  8060 ' })
  assert.ok(labels(destination!.reasons).includes('вы уже в этой системе'))
})

test('станция «вы уже пристыкованы» только внутри своей системы (59.4)', () => {
  const far = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 90, y: 0, z: 0 }, 30)
  assert.ok(far)

  const groups = groupMissions(
    [mission({ targetSystemId: 'far', targetStation: 'Archimedes City' })],
    {
      jumps: new Map([['far', far]]),
    },
  )

  const destination = pickNextDestination(groups, ru, {
    currentSystemName: 'Другая система',
    currentStationName: 'Archimedes City',
  })

  assert.ok(!labels(destination!.reasons).includes('вы уже пристыкованы здесь'))
  assert.ok(labels(destination!.reasons).some((l) => l.includes('прыжк')))
})

test('дальняя цель предупреждает числом прыжков (50.4)', () => {
  const far = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 90, y: 0, z: 0 }, 30)
  assert.ok(far)

  const groups = groupMissions([mission({ targetSystemId: 'far-system' })], {
    jumps: new Map([['far-system', far]]),
  })

  const destination = pickNextDestination(groups, ru)
  const jumpsReason = destination!.reasons.find((reason) => reason.label.includes('прыжк'))

  assert.equal(jumpsReason?.label, 'не меньше 3 прыжков · 90.0 ly')
  assert.equal(jumpsReason?.caution, true)
})

test('без данных о расстоянии причины говорят «неизвестно», а не выдумывают', () => {
  const groups = groupMissions([mission()])
  const destination = pickNextDestination(groups, ru)

  assert.ok(labels(destination!.reasons).includes('расстояние неизвестно'))
  assert.ok(labels(destination!.reasons).includes('supercruise неизвестен'))
})

test('режим разгрузки выбирает станцию, где закроется больше миссий (19)', () => {
  const groups = groupMissions([
    mission({ targetSystem: 'Россыпь', targetSystemId: 's1', targetStation: 'Ст 1' }),
    mission({ targetSystem: 'Россыпь', targetSystemId: 's1', targetStation: 'Ст 2' }),
    mission({ targetSystem: 'Россыпь', targetSystemId: 's1', targetStation: 'Ст 3' }),
    mission({ targetSystem: 'Кучно', targetSystemId: 's2', targetStation: 'База' }),
    mission({ targetSystem: 'Кучно', targetSystemId: 's2', targetStation: 'База' }),
  ])

  const normal = pickNextDestination(groups, ru, {})
  assert.equal(normal?.systemName, 'Россыпь')
  assert.equal(normal?.missionsAtStation, 1)

  const freeing = pickNextDestination(groups, ru, { freeingSlots: true })
  assert.equal(freeing?.systemName, 'Кучно')
  assert.equal(freeing?.missionsAtStation, 2)
  assert.ok(labels(freeing!.reasons).includes('освободит 2 слота'))
})

test('метрика 19.1 берёт слоты за время, а не только число слотов', () => {
  const near = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 30, y: 0, z: 0 }, 30)
  const far = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 240, y: 0, z: 0 }, 30)
  assert.ok(near && far)
  assert.equal(near.minJumps, 1)
  assert.equal(far.minJumps, 8)

  const groups = groupMissions(
    [
      mission({
        targetSystem: 'Далеко',
        targetSystemId: 'far',
        targetStation: 'Тройка',
        targetStationId: 'three',
      }),
      mission({
        targetSystem: 'Далеко',
        targetSystemId: 'far',
        targetStation: 'Тройка',
        targetStationId: 'three',
      }),
      mission({
        targetSystem: 'Далеко',
        targetSystemId: 'far',
        targetStation: 'Тройка',
        targetStationId: 'three',
      }),
      mission({
        targetSystem: 'Близко',
        targetSystemId: 'near',
        targetStation: 'Двойка',
        targetStationId: 'two',
      }),
      mission({
        targetSystem: 'Близко',
        targetSystemId: 'near',
        targetStation: 'Двойка',
        targetStationId: 'two',
      }),
    ],
    {
      jumps: new Map([
        ['near', near],
        ['far', far],
      ]),
    },
  )

  const stationFacts = new Map([
    ['three', { distanceToArrivalLs: 300 }],
    ['two', { distanceToArrivalLs: 50 }],
  ])

  const freeing = pickNextDestination(groups, ru, { freeingSlots: true, stationFacts })

  assert.equal(freeing?.stationName, 'Двойка', 'метрика обязана предпочесть слоты за время')
  assert.equal(freeing?.missionsAtStation, 2)
})

test('станция без расстояния идёт после посчитанных, а не впереди них (12)', () => {
  const groups = groupMissions([
    mission({
      targetSystem: 'Одна',
      targetSystemId: 's1',
      targetStation: 'Без данных',
      targetStationId: 'unknown',
    }),
    mission({
      targetSystem: 'Одна',
      targetSystemId: 's1',
      targetStation: 'Без данных',
      targetStationId: 'unknown',
    }),
    mission({
      targetSystem: 'Две',
      targetSystemId: 's2',
      targetStation: 'С данными',
      targetStationId: 'known',
    }),
  ])

  const freeing = pickNextDestination(groups, ru, {
    freeingSlots: true,
    stationFacts: new Map([['known', { distanceToArrivalLs: 200 }]]),
  })

  assert.equal(freeing?.stationName, 'С данными')
})

test('в режиме разгрузки при равном числе миссий выигрывает ближняя (19)', () => {
  const near = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, 30)
  const far = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 80, y: 0, z: 0 }, 30)
  assert.ok(near && far)

  const groups = groupMissions(
    [
      mission({ targetSystem: 'Далеко', targetSystemId: 'far', targetStation: 'Дальняя' }),
      mission({ targetSystem: 'Далеко', targetSystemId: 'far', targetStation: 'Дальняя' }),
      mission({ targetSystem: 'Близко', targetSystemId: 'near', targetStation: 'Ближняя' }),
      mission({ targetSystem: 'Близко', targetSystemId: 'near', targetStation: 'Ближняя' }),
    ],
    {
      jumps: new Map([
        ['near', near],
        ['far', far],
      ]),
    },
  )

  const freeing = pickNextDestination(groups, ru, { freeingSlots: true })
  assert.equal(freeing?.stationName, 'Ближняя')
})
