import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RoutePlanBlock } from '@/widgets/mission-basket/ui/RoutePlan'
import type { RoutePlan } from '@/features/route-plan'

const plan: RoutePlan = {
  stops: [
    { systemKey: 'a', systemName: 'Ngalinn', jumps: 1, seconds: 150, missions: 2, cargoT: 12 },
    { systemKey: 'b', systemName: 'Mainani', jumps: 3, seconds: 330, missions: 1, cargoT: 0 },
  ],
  returnLeg: { systemName: 'Canopus', stationName: 'Jameson Memorial', jumps: 2, seconds: 210 },
  seconds: 690,
  skipped: [],
}

const render = (value: RoutePlan | null) =>
  renderToStaticMarkup(React.createElement(RoutePlanBlock, { plan: value }))

test('маршрут показан по порядку и со временем (18.3)', () => {
  const html = render(plan)

  assert.match(html, /Ngalinn/)
  assert.match(html, /Mainani/)
  assert.match(html, /12 min/, 'весь обход с возвратом — 690 секунд')
  assert.match(html, /<ol/)
})

test('одна система — не маршрут', () => {
  assert.equal(render({ ...plan, stops: [plan.stops[0]!] }), '')
  assert.equal(render(null), '')
})

test('пропущенные системы названы, а не скрыты (12)', () => {
  const html = render({ ...plan, skipped: ['Безымянная'] })

  assert.match(html, /Безымянная/)
})

test('сказано, что корзину маршрут не переставляет (43.5)', () => {
  assert.match(render(plan), /does not reorder the missions list/i)
})

test('возврат на стартовую станцию — строка маршрута (18.5)', () => {
  const html = render(plan)

  assert.match(html, /Jameson Memorial/)
  assert.match(html, /back/i)
  assert.match(html, /Canopus/, 'начало круга названо системой и станцией')
})

test('вне стыковки круг замыкается на систему, а не на станцию (18.5)', () => {
  const html = render({
    ...plan,
    returnLeg: { ...plan.returnLeg, stationName: null },
  })

  assert.match(html, /not docked/i)
  assert.doesNotMatch(html, /Jameson Memorial/)
})

test('груз точки виден там же, где порядок (18.6)', () => {
  const html = render(plan)

  assert.match(html, /12 t/, 'у первой точки двенадцать тонн')
})

test('положение командира неизвестно — про начало круга ничего не говорится', () => {
  const html = render({
    ...plan,
    returnLeg: { ...plan.returnLeg, systemName: '', stationName: null },
  })

  assert.doesNotMatch(html, /A loop from/i)
  assert.match(html, /back/i, 'само возвратное плечо остаётся')
})
