import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderInDom } from '@/shared/test/renderInDom'
import { returnLegKey, writeReturnLegs } from '@/entities/mission-store'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { StoredMission, UseMissionStoreResult } from '@/entities/mission-store'
import { MissionBasket } from '@/widgets/mission-basket'

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

function store(missions: StoredMission[]): UseMissionStoreResult {
  return {
    missions,
    usedSlots: missions.length,
    completedCount: missions.filter((item) => item.completed === true).length,
    isFull: missions.length >= 20,
    addMission: () => 'added',
    removeMission: () => {},
    toggleCompleted: () => {},
    removeSystem: () => {},
    removeCompletedInSystem: () => {},
    removeCompletedAtStation: () => {},
    clearAll: () => {},
    replaceAll: () => {},
    returnReminders: [],
    dismissReturnReminder: () => {},
    setReturnLeg: () => {},
    toggleReturnExtraRun: () => {},
  } as unknown as UseMissionStoreResult
}

function commanderStub(
  overrides: { requiredPadSize?: 'S' | 'M' | 'L'; features?: string[] } = {},
): UseCommanderStateResult {
  return {
    status: 'success',
    data: {
      state: { requiredPadSize: overrides.requiredPadSize ?? null },
      features: overrides.features ?? [],
    },
  } as unknown as UseCommanderStateResult
}

function render(
  missions: StoredMission[],
  commander: UseCommanderStateResult = commanderStub(),
): string {
  return renderToStaticMarkup(
    React.createElement(MissionBasket, {
      regionKey: 'imperial',
      store: store(missions),
      position: null,
      commander,
      jumpOrigin: null,
    }),
  )
}

test('пустая корзина объясняет, что делать', () => {
  const html = render([])

  assert.match(html, /Empty so far/)
  assert.match(html, /0 \/ 20/)
})

test('цели миссий видны вместе со счётчиком слотов', () => {
  const html = render([mission(), mission({ targetStation: 'Другая станция' })])

  assert.match(html, /HIP 8060/)
  assert.match(html, /Fernandes Base/)
  assert.match(html, /Другая станция/)
  assert.match(html, /2 \/ 20/)
})

test('на девятнадцатом слоте сказано, что остался один', () => {
  const html = render(Array.from({ length: 19 }, () => mission()))

  assert.match(html, /One slot left/)
})

test('на лимите сказано, что он достигнут', () => {
  const html = render(Array.from({ length: 20 }, () => mission()))

  assert.match(html, /Mission limit reached/)
})

test('система с одной миссией помечена «подкопить» (17)', () => {
  const html = render([mission()])

  assert.match(html, /stock up/)
})

test('система с тремя миссиями не помечена: разумно — это норма, а не бейдж', () => {
  const html = render([mission(), mission(), mission()])

  assert.doesNotMatch(html, />stock up</)
})

test('выполненные миссии в порог не идут', () => {
  const html = render([mission({ completed: true }), mission({ completed: true }), mission()])

  assert.match(html, />stock up</)
})

test('порог настраивается из самой корзины и сказано, что он не запрещает', () => {
  const html = render([])

  assert.match(html, /Worth flying from/)
  assert.match(html, /High priority from/)
  assert.match(html, /forbids nothing/)
})

test('копируются система, станция и тело (24)', () => {
  const html = render([mission({ targetBody: 'HIP 8060 A 1' })])

  assert.match(html, /Copy system HIP 8060/)
  assert.match(html, /Copy station Fernandes Base/)
  assert.match(html, /Copy body HIP 8060 A 1/)
})

test('у станции без тела кнопки «скопировать тело» нет', () => {
  const html = render([mission()])

  assert.doesNotMatch(html, /Copy body/)
})

test('в текущей системе показан порядок обхода станций (25)', () => {
  const html = renderToStaticMarkup(
    React.createElement(MissionBasket, {
      regionKey: 'imperial',
      store: store([
        mission({ targetStation: 'Fernandes Base' }),
        mission({ targetStation: 'Sealey Lab' }),
        mission({ targetStation: 'Sealey Lab' }),
        mission({ targetStation: 'Sealey Lab' }),
        mission({ targetStation: 'Sealey Lab' }),
      ]),
      position: { systemName: 'hip 8060', stationName: null },
      commander: commanderStub(),
      jumpOrigin: null,
    }),
  )

  assert.match(html, /you are here/)
  assert.match(html, /First Sealey Lab — 4 missions, then Fernandes Base — 1\./)
})

test('вне текущей системы порядок обхода не показывается', () => {
  const html = render([
    mission({ targetStation: 'Fernandes Base' }),
    mission({ targetStation: 'Sealey Lab' }),
  ])

  assert.doesNotMatch(html, /First [^<]* — \d/)
})

test('станция, куда не сесть текущим кораблём, помечена словами и рамкой (71)', () => {
  const html = render(
    [mission({ targetStation: 'Hickam Survey' })],
    commanderStub({ requiredPadSize: 'L', features: ['pad-mismatch'] }),
  )

  assert.doesNotMatch(html, /does not fit the current ship/)
})

test('выключенный флаг не меняет корзину (71)', () => {
  const missions = [mission({ targetStation: 'Hickam Survey' })]

  assert.equal(
    render(missions, commanderStub({ requiredPadSize: 'L' })),
    render(missions, commanderStub()),
  )
})

test('число заданий стоит в строке станции, а не отдельной строкой (74)', () => {
  const html = render([
    mission({ targetStation: 'Hickam Survey' }),
    mission({ targetStation: 'Hickam Survey' }),
  ])

  assert.match(html, /2 missions/)
  assert.doesNotMatch(html, /Количество миссий/)
})

test('склонение числа заданий в строке станции', () => {
  assert.match(render([mission({ targetStation: 'A' })]), /1 mission/)
})

test('своя пометка видна в корзине без раскрытия (75)', () => {
  const html = render([mission({ targetStation: 'Hickam Survey', note: 'по пути к Ngalinn' })])

  assert.match(html, /по пути к Ngalinn/)
})

test('у заданий без пометки лишних строк не появляется (75)', () => {
  const html = render([mission({ targetStation: 'Hickam Survey' })])

  assert.doesNotMatch(html, /italic/)
})

test('у двух заданий на станции показываются обе пометки (75)', () => {
  const html = render([
    mission({ targetStation: 'A', note: 'первая причина' }),
    mission({ targetStation: 'A', note: 'вторая причина' }),
  ])

  assert.match(html, /первая причина/)
  assert.match(html, /вторая причина/)
})

test('ручные записи уходят в свой блок с рамкой и подписью (70.7)', () => {
  const html = render([mission({ targetStation: 'Hickam Survey' })])

  assert.match(html, /Added by hand — the game never reported these missions/)
  assert.match(html, /border-warm-400/)
  assert.doesNotMatch(html, /border-danger/)
})

test('у системы есть переключатель «сделать следующей» (88)', () => {
  const html = render([mission({ targetSystem: 'HIP 8060' })])

  assert.match(html, /type="checkbox"/)
  assert.match(html, /Make system HIP 8060 the next one/)
  assert.match(html, /Make it next/)
})

function renderAsAdmin(missions: StoredMission[], isAdmin: boolean): string {
  return renderToStaticMarkup(
    React.createElement(MissionBasket, {
      regionKey: 'imperial',
      store: store(missions),
      position: null,
      commander: commanderStub(),
      jumpOrigin: null,
      isAdmin,
    } as never),
  )
}

test('у неадмина переключателя отметки нет вовсе (86.2)', () => {
  const html = renderAsAdmin([mission()], false)

  assert.doesNotMatch(html, /стоит у другой звезды/)
})

test('без id станции переключателя нет даже у админа', () => {
  const html = renderAsAdmin([mission()], true)

  assert.doesNotMatch(html, /стоит у другой звезды/)
})

test('кнопка возврата видна в строке станции, а не в раскрытии (109)', () => {
  const html = render([mission()])

  const stationBlock = html.slice(html.indexOf('Fernandes Base'))
  const beforeDetails = stationBlock.slice(0, stationBlock.indexOf('<details'))
  assert.match(beforeDetails, /Return trip/)
})

test('адрес возврата стоит под названием станции с подписью', async () => {
  writeReturnLegs({
    [returnLegKey('HIP 8060', 'Fernandes Base')]: {
      systemName: 'Ngalinn',
      stationName: 'Gloss Gateway',
    },
  })

  const view = await renderInDom(
    React.createElement(MissionBasket, {
      regionKey: 'imperial',
      store: store([mission()]),
      position: null,
      commander: commanderStub(),
      jumpOrigin: null,
    }),
  )
  const html = view.html()
  view.unmount()
  writeReturnLegs({})

  assert.match(html, /Ngalinn · Gloss Gateway/)
  assert.match(html, /return station/)
})
