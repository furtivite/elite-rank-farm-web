import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { estimateJumps } from '@/entities/galaxy-data'
import { groupMissions, type StoredMission } from '@/entities/mission-store'
import { MISSION_WARN_FROM } from '@/entities/mission-store'
import { NextDestinationPanel, pickNextDestination } from '@/features/next-destination'

let counter = 0

function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: 'Ngalinn',
    targetStation: 'Hickam Survey',
    targetSystemId: 'sys',
    addedAt: `2026-09-03T10:00:0${counter % 10}.000Z`,
    ...overrides,
  }
}

function render(missions: StoredMission[], jumps?: Map<string, ReturnType<typeof estimateJumps>>) {
  const groups = groupMissions(missions, jumps ? { jumps: jumps as never } : undefined)

  const destination = pickNextDestination(groups, createTranslate('en'), {
    stationFacts: new Map(),
    ratings: {},
    pinned: null,
    currentSystemName: null,
    currentStationName: null,
    freeingSlots: missions.length >= MISSION_WARN_FROM,
  })

  return renderToStaticMarkup(
    React.createElement(NextDestinationPanel, {
      usedSlots: missions.length,
      destination,
    }),
  )
}

test('панель называет систему, станцию и причины', () => {
  const html = render([mission(), mission()])

  assert.match(html, /Where to next/)
  assert.match(html, /Ngalinn/)
  assert.match(html, /Hickam Survey/)
  assert.match(html, /2 missions in the system/)
})

test('пустая корзина не даёт панели', () => {
  const html = render([])

  assert.equal(html, '')
})

test('дальняя цель предупреждает числом прыжков', () => {
  const far = estimateJumps({ x: 0, y: 0, z: 0 }, { x: 90, y: 0, z: 0 }, 30)
  assert.ok(far)

  const html = render([mission()], new Map([['sys', far]]))

  assert.match(html, /at least 3 jumps/)
})

test('неизвестное расстояние названо неизвестным, а не нулём', () => {
  const html = render([mission()])

  assert.match(html, /distance unknown/)
})

test('с 18 слотов панель переключается на разгрузку (19)', () => {
  const many = Array.from({ length: 18 }, () =>
    mission({ targetSystem: 'Mainani', targetSystemId: 'far', targetStation: 'Одна база' }),
  )

  const html = render(many)

  assert.match(html, /Where to hand missions in/)
  assert.doesNotMatch(html, /разгружаться/)
  assert.match(html, /frees 18 slots/)
})

test('до 18 слотов режим не включается', () => {
  const html = render([mission(), mission()])

  assert.match(html, /Where to next/)
  assert.doesNotMatch(html, /frees/)
})

test('панель зовёт на склад, когда груз задания ещё там', () => {
  const html = renderToStaticMarkup(
    React.createElement(NextDestinationPanel, {
      usedSlots: 1,
      destination: null,
      plan: {
        pickup: {
          systemName: 'Ngalinn',
          stationName: 'Sanger Terminal',
          remaining: 36,
          commodities: ['Food Cartridges'],
          missions: 1,
        },
        local: null,
        shuttle: false,
      },
    }),
  )

  assert.match(html, /Sanger Terminal/)
  assert.match(html, /pick up 36/)
  assert.match(html, /Food Cartridges/)
  assert.match(html, /nothing waiting for you/, 'сказано, почему не на сдачу')
})

test('на складе панель молчит про режим разгрузки', () => {
  const html = renderToStaticMarkup(
    React.createElement(NextDestinationPanel, {
      usedSlots: 20,
      destination: null,
      plan: {
        pickup: {
          systemName: 'Ngalinn',
          stationName: 'Sanger Terminal',
          remaining: 36,
          commodities: [],
          missions: 1,
        },
        local: null,
        shuttle: false,
      },
    }),
  )

  assert.match(html, /Where to next/)
  assert.doesNotMatch(html, /free/i)
})

test('вторая цель — сдать местное, и в челноке она идёт первой', () => {
  const plan = {
    pickup: {
      systemName: 'Canopus',
      stationName: 'Sanger Terminal',
      remaining: 36,
      commodities: [],
      missions: 1,
    },
    local: { systemName: 'Ngalinn', stationName: 'Hickam Survey', missions: 2 },
    shuttle: false,
  }

  const straight = renderToStaticMarkup(
    React.createElement(NextDestinationPanel, { usedSlots: 2, destination: null, plan }),
  )
  assert.ok(
    straight.indexOf('Sanger Terminal') < straight.indexOf('Hickam Survey'),
    'вне челнока первым идёт склад: без груза сдавать нечего',
  )

  const shuttling = renderToStaticMarkup(
    React.createElement(NextDestinationPanel, {
      usedSlots: 2,
      destination: null,
      plan: { ...plan, shuttle: true },
    }),
  )
  assert.ok(
    shuttling.indexOf('Hickam Survey') < shuttling.indexOf('Sanger Terminal'),
    'в челноке местное сдаётся первым — оно по дороге',
  )
  assert.match(shuttling, /shuttling between two systems/)
})

const RING = {
  route: ['Esposito City', 'Tull Reach', 'Waxwizard Hub', 'Esposito City'],
  from: { systemName: 'Col 285 Sector MH-M c7-5', stationName: 'Waxwizard Hub' },
  to: { systemName: 'HIP 11241', stationName: 'Esposito City' },
  emptyReturn: true,
}

test('кольцевое задание — своим блоком рядом с целью', () => {
  const html = renderToStaticMarkup(
    React.createElement(NextDestinationPanel, {
      usedSlots: 2,
      destination: null,
      plan: {
        pickup: {
          systemName: 'HIP 11241',
          stationName: 'Esposito City',
          remaining: 3748,
          commodities: [],
          missions: 1,
        },
        local: null,
        shuttle: false,
      },
      ring: RING,
    }),
  )

  assert.match(html, /aria-label="Ring mission"/)
  assert.match(html, /Esposito City → Tull Reach → Waxwizard Hub → Esposito City/)
  assert.match(html, /now: Waxwizard Hub → Esposito City/)
  assert.match(html, /empty run back/)
  assert.match(html, /pick up 3748/, 'цель панели осталась на месте')
})

test('без кольца блока нет', () => {
  const html = render([mission()])

  assert.doesNotMatch(html, /Ring mission/)
})

test('две цели читаются как две, а не как одна длинная', () => {
  const html = renderToStaticMarkup(
    React.createElement(NextDestinationPanel, {
      usedSlots: 2,
      destination: null,
      plan: {
        pickup: {
          systemName: 'Canopus',
          stationName: 'Sanger Terminal',
          remaining: 36,
          commodities: [],
          missions: 1,
        },
        local: { systemName: 'Ngalinn', stationName: 'Hickam Survey', missions: 2 },
        shuttle: false,
      },
    }),
  )

  assert.match(html, /aria-label="Cargo first"/)
  assert.match(html, /aria-label="You can hand in here"/)
})
