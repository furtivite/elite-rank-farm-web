import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ResultsControls } from '@/widgets/farm-navigator/ui/ResultsControls/ResultsControls'

function render(shownCount: number, totalCount: number): string {
  return renderToStaticMarkup(
    React.createElement(ResultsControls, {
      filter: { system: '', station: '', ownSideOnly: false },
      onFilterChange: () => {},
      sort: 'score' as const,
      onSortChange: () => {},
      shownCount,
      totalCount,
      farmMode: 'empire' as const,
    }),
  )
}

test('у каждого поля есть видимое имя (WCAG 3.3.2)', () => {
  const html = render(10, 10)

  assert.match(html, /<label/)
  assert.equal((html.match(/<label/g) ?? []).length >= 2, true)
})

test('скрытые фильтром строки посчитаны, а не молча пропали', () => {
  const html = render(3, 10)

  assert.match(html, /3/)
  assert.match(html, /10/)
})
