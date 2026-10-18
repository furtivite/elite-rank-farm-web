import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { buttonByText, renderInDom } from '@/shared/test/renderInDom'
import type { ScoredSystemGroup } from '@/features/farm-recommender'
import { FarmResults } from '@/widgets/farm-navigator'

const idleRefresh = {
  pendingSystemId: null,
  errorSystemId: null,
  errorMessage: null,
  refresh: async () => {},
}

const group: ScoredSystemGroup = {
  systemId: 's1',
  systemName: 'Ngalinn',
  distanceLy: 12.3,
  bestScore: 10,
  missionCount: 0,
  stations: [
    {
      station: {
        id: 'st1',
        name: 'Black Landing',
        type: 'Outpost',
        maxPadSize: 'M',
        distanceToArrivalLs: 120,
      },
      factions: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
      factionsDataState: 'unknown',
      rating: undefined,
      missionCount: 0,
      score: 10,
      reasons: [],
    } as unknown as ScoredSystemGroup['stations'][number],
  ],
}

function tabOrder(container: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button, input, select, textarea, summary, [tabindex]'

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    if (element.hasAttribute('disabled')) {
      return false
    }
    if (Number(element.getAttribute('tabindex') ?? '0') < 0) {
      return false
    }
    return element.closest('[aria-hidden="true"], [inert]') === null
  })
}

async function render() {
  return renderInDom(
    React.createElement(FarmResults, {
      status: 'success' as const,
      errorMessage: null,
      groups: [group],
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      refresh: idleRefresh,
      farmMode: 'empire' as const,
    }),
  )
}

test('система раскрывается с клавиатуры, и станция попадает в обход Tab (118)', async () => {
  const view = await render()

  const system = buttonByText(view.container, 'Ngalinn')
  assert.ok(system, 'у системы есть кнопка, а не кликабельный div')
  assert.equal(system.getAttribute('aria-expanded'), 'false')

  await view.click(system)

  assert.equal(system.getAttribute('aria-expanded'), 'true')
  const station = buttonByText(view.container, 'Black Landing')
  assert.ok(station, 'станция появилась')
  assert.ok(tabOrder(view.container).includes(station as HTMLElement), 'станция в обходе Tab')
  view.unmount()
})

test('кнопки станции доступны с клавиатуры (118)', async () => {
  const view = await render()

  await view.click(buttonByText(view.container, 'Ngalinn'))
  await view.click(buttonByText(view.container, 'Black Landing'))

  const order = tabOrder(view.container)
  for (const label of ['+1 mission', 'Good', 'Bad', 'Block', 'Copy system', 'Copy station']) {
    const button = buttonByText(view.container, label)
    assert.ok(button, `кнопки «${label}» нет`)
    assert.ok(order.includes(button as HTMLElement), `до «${label}» не дойти по Tab`)
  }
  view.unmount()
})

test('порядок обхода совпадает с порядком на экране (118)', async () => {
  const view = await render()

  await view.click(buttonByText(view.container, 'Ngalinn'))
  await view.click(buttonByText(view.container, 'Black Landing'))

  const order = tabOrder(view.container)
  const station = order.indexOf(buttonByText(view.container, 'Black Landing') as HTMLElement)
  const add = order.indexOf(buttonByText(view.container, '+1 mission') as HTMLElement)

  assert.ok(station >= 0 && add > station, 'кнопки станции идут после её строки')
  view.unmount()
})

test('пока идёт поиск, прежняя выдача не нажимается и с клавиатуры (118)', async () => {
  const view = await renderInDom(
    React.createElement(FarmResults, {
      status: 'loading' as const,
      errorMessage: null,
      groups: [group],
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      refresh: idleRefresh,
      farmMode: 'empire' as const,
    }),
  )

  const system = buttonByText(view.container, 'Ngalinn')
  assert.ok(system, 'прежняя выдача осталась на экране (64.3)')
  assert.ok(
    !tabOrder(view.container).includes(system as HTMLElement),
    'но в обход Tab она не входит, пока грузится',
  )
  view.unmount()
})
