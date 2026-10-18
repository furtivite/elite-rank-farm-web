import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { GalaxyRegionStatus } from '@/widgets/galaxy-region-status'

const render = () =>
  renderToStaticMarkup(React.createElement(GalaxyRegionStatus, { activeRegion: 'galaxy' as const }))

test('карточка называет набор данных', () => {
  assert.match(render(), /Populated galaxy|Населённая галактика/)
})

test('первый кадр держит место скелетоном, а не пустотой', () => {
  assert.match(render(), /skeleton/)
})

test('кнопка проверки одна', () => {
  assert.equal((render().match(/<button/g) ?? []).length, 1)
})
