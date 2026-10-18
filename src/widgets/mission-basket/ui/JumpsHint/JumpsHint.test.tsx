import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { JumpEstimate } from '@/entities/galaxy-data'
import { JumpsHint } from '@/widgets/mission-basket/ui/JumpsHint'

const render = (jumps: JumpEstimate | null) =>
  renderToStaticMarkup(React.createElement(JumpsHint, { jumps }))

const estimate = (source: JumpEstimate['source']): JumpEstimate =>
  ({ distanceLy: 42.5, minJumps: 3, isFar: true, source }) as JumpEstimate

test('цель вне датасета: причина видна, а не только звучит', () => {
  const html = render(null)

  assert.match(html, /distance unknown: the target is not in the region dataset/)
  assert.doesNotMatch(html, /sr-only/)
})

test('у числа прыжков видно, почему оно «не меньше» или «примерно»', () => {
  for (const source of ['straight', 'graph'] as const) {
    const html = render(estimate(source))

    assert.match(html, source === 'graph' ? /map of known stars/ : /cannot be shorter/)
    assert.doesNotMatch(html, /sr-only/)
  }
})
