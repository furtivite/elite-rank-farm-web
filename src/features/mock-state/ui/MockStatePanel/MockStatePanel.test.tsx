import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslate } from '@/shared/lib/i18n'
import { MOCK_SCENARIOS } from '@/entities/commander-state'
import { MockStatePanel } from '@/features/mock-state'

test('панель свёрнута и перечисляет все наборы', () => {
  const html = renderToStaticMarkup(React.createElement(MockStatePanel))

  const en = createTranslate('en')

  for (const scenario of MOCK_SCENARIOS) {
    assert.match(html, new RegExp(en(scenario.labelKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('выключенный мок сказан словом, а не только цветом (WCAG 1.4.1)', () => {
  const html = renderToStaticMarkup(React.createElement(MockStatePanel))

  assert.match(html, /off, real data shown/)
})

test('панель sticky, а не fixed — иначе она закроет элемент в фокусе (2.4.11)', () => {
  const html = renderToStaticMarkup(React.createElement(MockStatePanel))

  assert.match(html, /sticky bottom-0/)
  assert.doesNotMatch(html, /class="[^"]*\bfixed\b/)
})

test('активный набор помечен для screen reader', () => {
  const html = renderToStaticMarkup(React.createElement(MockStatePanel))

  assert.match(html, /aria-pressed="true"/)
})
