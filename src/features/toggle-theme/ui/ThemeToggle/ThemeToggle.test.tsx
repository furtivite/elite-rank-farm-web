import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ThemeProvider } from '@/shared/lib/theme'
import { ThemeToggle } from '@/features/toggle-theme'

const html = renderToStaticMarkup(
  React.createElement(ThemeProvider, null, React.createElement(ThemeToggle)),
)

test('у группы кнопок есть имя', () => {
  assert.match(html, /aria-label|<legend|role="group"/)
})

test('выбранная тема помечена не только оформлением (WCAG 1.4.1)', () => {
  assert.match(html, /aria-pressed="true"|aria-checked="true"/)
})

test('на сервере выбрана системная тема — она же в первом кадре у всех', () => {
  assert.match(html, /Системная|Как в системе|system/i)
})
