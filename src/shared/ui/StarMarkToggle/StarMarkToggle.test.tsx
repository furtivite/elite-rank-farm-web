import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StarMarkToggle } from '@/shared/ui/StarMarkToggle'

function render(isMarked: boolean): string {
  return renderToStaticMarkup(
    React.createElement(StarMarkToggle, {
      stationName: 'Gloss Gateway',
      isMarked,
      onChange: () => {},
    }),
  )
}

test('смысл значка виден, а не только читается диктором (2026-10-18)', () => {
  const html = render(false)

  assert.match(html, /<span>other star<\/span>/)
  assert.match(html, /sr-only"> — Gloss Gateway orbits a different star/)
})
