import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ResultsControls } from '@/widgets/farm-navigator/ui/ResultsControls/ResultsControls'
import { ResultsControlsSkeleton } from '@/widgets/farm-navigator/ui/ResultsControlsSkeleton'

const skeleton = renderToStaticMarkup(React.createElement(ResultsControlsSkeleton))
const real = renderToStaticMarkup(
  React.createElement(ResultsControls, {
    filter: { system: '', station: '', ownSideOnly: false },
    onFilterChange: () => {},
    sort: 'score' as const,
    onSortChange: () => {},
    shownCount: 5,
    totalCount: 5,
    farmMode: 'empire' as const,
  }),
)

function count(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length
}

test('та же сетка, что у панели', () => {
  const grid = /grid gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-3/
  assert.match(skeleton, grid)
  assert.match(real, grid)
})

test('столько же ячеек, сколько в панели', () => {
  const cell = /class="flex flex-col gap-1\.5"/g
  assert.equal(count(skeleton, cell), count(real, cell))
})

test('высота ячеек совпадает: подписи и поля той же меры', () => {
  assert.equal(count(skeleton, /min-h-4/g), count(real, /min-h-4/g))
  assert.equal(count(skeleton, /min-h-11/g), count(real, /min-h-11/g))
})

test('строка счёта занимает место и в заглушке', () => {
  const fullWidth = /sm:col-span-2 xl:col-span-3/g
  assert.equal(count(skeleton, fullWidth), count(real, fullWidth))
})

test('заглушка не читается скринридером и ничего не обещает', () => {
  assert.match(skeleton, /aria-hidden="true"/)
  assert.doesNotMatch(skeleton, /<input|<select|<button/)
})
