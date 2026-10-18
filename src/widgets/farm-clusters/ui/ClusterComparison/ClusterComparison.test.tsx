import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ClusterSummary } from '@/features/farm-recommender'
import { ClusterComparison } from '@/widgets/farm-clusters'

const summaries: ClusterSummary[] = [
  {
    clusterId: 'c1',
    name: 'Imperial — Ngalinn cluster',
    systemCount: 4,
    stationCount: 9,
    bestScore: 30,
    topScore: 96,
  },
  {
    clusterId: null,
    name: 'Auto discovery',
    systemCount: 2,
    stationCount: 3,
    bestScore: 15,
    topScore: 33,
  },
  { clusterId: 'c2', name: 'Пустой', systemCount: 0, stationCount: 0, bestScore: 0, topScore: 0 },
]

function render(overrides: Partial<React.ComponentProps<typeof ClusterComparison>> = {}): string {
  return renderToStaticMarkup(
    React.createElement(ClusterComparison, {
      status: 'success' as const,
      errorMessage: null,
      summaries,
      selectedClusterId: null,
      onChoose: () => {},
      ...overrides,
    }),
  )
}

test('лидер помечен словом, а не только порядком (WCAG 1.4.1)', () => {
  const html = render()

  assert.match(html, /Imperial — Ngalinn cluster/)
  assert.match(html, />best</)
})

test('видно, из чего сложилась оценка (13.2)', () => {
  const html = render()

  assert.match(html, /4 systems · 9 stations/)
  assert.match(html, /best station: 30/)
  assert.match(html, /No stations match the filters/)
})

test('у текущего выбора кнопки нет — вести некуда', () => {
  const html = render({ selectedClusterId: null })

  assert.match(html, /currently selected/)
  assert.doesNotMatch(html, /To Auto discovery/)
})

test('ошибка сравнения показывается, а не молчит', () => {
  const html = render({ status: 'error', errorMessage: 'Сеть недоступна' })

  assert.match(html, /Сеть недоступна/)
})
