import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { StoredMission, UseMissionStoreResult } from '@/entities/mission-store'
import { MissionBasket } from '@/widgets/mission-basket'

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]'

let counter = 0

function mission(overrides: Partial<StoredMission> = {}): StoredMission {
  counter += 1
  return {
    id: `m${counter}`,
    targetSystem: 'HIP 8060',
    targetStation: 'Fernandes Base',
    addedAt: `2026-09-16T10:00:0${counter % 10}.000Z`,
    ...overrides,
  }
}

function store(missions: StoredMission[]): UseMissionStoreResult {
  return {
    missions,
    usedSlots: missions.length,
    completedCount: missions.filter((item) => item.completed === true).length,
    isFull: false,
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

function commanderStub(): UseCommanderStateResult {
  return {
    status: 'success',
    data: { state: { requiredPadSize: null }, features: [] },
  } as unknown as UseCommanderStateResult
}

function tabOrder(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => {
    if (element.hasAttribute('disabled')) {
      return false
    }
    if (Number(element.getAttribute('tabindex') ?? '0') < 0) {
      return false
    }
    return element.closest('[aria-hidden="true"], [inert]') === null
  })
}

async function renderBasket() {
  return renderInDom(
    React.createElement(MissionBasket, {
      regionKey: 'imperial',
      store: store([mission(), mission({ targetStation: 'Другая станция' })]),
      position: null,
      commander: commanderStub(),
      jumpOrigin: null,
    }),
  )
}

test('у каждого раскрытия корзины есть фокусируемый заголовок и досягаемое содержимое (118.6)', async () => {
  const view = await renderBasket()

  const blocks = Array.from(view.container.querySelectorAll<HTMLDetailsElement>('details'))
  assert.ok(blocks.length > 0, 'в полной корзине есть что раскрывать')

  for (const block of blocks) {
    const summary = block.querySelector('summary')
    const title = (summary?.textContent ?? '').slice(0, 40)

    assert.ok(summary, `раскрытие без summary: ${block.outerHTML.slice(0, 80)}`)

    block.open = true
    await view.settle()

    const order = tabOrder(view.container)
    assert.ok(order.includes(summary), `до заголовка «${title}» не дойти по Tab`)

    const inner = Array.from(block.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element !== summary,
    )

    for (const control of inner) {
      assert.ok(
        order.includes(control),
        `в «${title}» есть кнопка, до которой не дойти: ${control.outerHTML.slice(0, 80)}`,
      )
      assert.ok(
        order.indexOf(control) > order.indexOf(summary),
        `в «${title}» кнопка стоит в обходе раньше своего заголовка`,
      )
    }
  }

  view.unmount()
})

test('в раскрытой корзине нет ни одной ловушки (118.6)', async () => {
  const view = await renderBasket()

  for (const control of Array.from(
    view.container.querySelectorAll<HTMLElement>('[aria-expanded="false"]'),
  )) {
    await view.click(control)
  }
  for (const details of Array.from(
    view.container.querySelectorAll<HTMLDetailsElement>('details:not([open])'),
  )) {
    details.open = true
    await view.settle()
  }

  const container = view.container

  assert.deepEqual(
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => element.closest('[aria-hidden="true"], [inert]') !== null)
      .map((element) => element.outerHTML.slice(0, 120)),
    [],
    'фокусируемое внутри aria-hidden или inert',
  )

  assert.deepEqual(
    Array.from(container.querySelectorAll<HTMLElement>('[aria-expanded]'))
      .filter((element) => !['BUTTON', 'SUMMARY', 'A', 'INPUT'].includes(element.tagName))
      .map((element) => element.tagName),
    [],
    '«раскрыть» на неинтерактивном узле',
  )

  assert.deepEqual(
    Array.from(container.querySelectorAll<HTMLElement>('[aria-controls]'))
      .map((element) => element.getAttribute('aria-controls') ?? '')
      .filter((id) => id !== '' && container.querySelector(`[id="${id}"]`) === null),
    [],
    'aria-controls в никуда',
  )

  view.unmount()
})
