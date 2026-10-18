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

function groups(count: number): ScoredSystemGroup[] {
  return Array.from({ length: count }, (_, index) => ({
    systemId: `s${index}`,
    systemName: `Система ${index}`,
    distanceLy: index,
    stations: [],
    bestScore: 10,
    missionCount: 0,
  }))
}

function render(count: number) {
  return renderInDom(
    React.createElement(FarmResults, {
      status: 'success' as const,
      errorMessage: null,
      groups: groups(count),
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      refresh: idleRefresh,
      farmMode: 'empire' as const,
    }),
  )
}

test('кнопка открывает следующую порцию систем', async () => {
  const view = await render(60)

  assert.doesNotMatch(view.html(), /Система 25/, 'до нажатия 26-й системы нет')

  await view.click(buttonByText(view.container, 'Show'))

  assert.match(view.html(), /Система 25/)
  assert.match(view.html(), /Система 49/)
  assert.doesNotMatch(view.html(), /Система 50/, 'открылась ровно одна порция')
  view.unmount()
})

test('на последней порции кнопка исчезает', async () => {
  const view = await render(30)

  await view.click(buttonByText(view.container, 'Show'))

  assert.match(view.html(), /Система 29/)
  assert.equal(buttonByText(view.container, 'Show'), null)
  view.unmount()
})

test('счётчик над таблицей не меняется от нажатия: найдено столько же', async () => {
  const view = await render(60)

  await view.click(buttonByText(view.container, 'Show'))

  assert.match(view.html(), /60 systems/)
  view.unmount()
})
