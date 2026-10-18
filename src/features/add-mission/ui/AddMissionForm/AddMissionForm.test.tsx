import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AddMissionForm } from '@/features/add-mission'

function render(isFull: boolean): string {
  return renderToStaticMarkup(
    React.createElement(AddMissionForm, {
      regionKey: 'imperial' as const,
      isFull,
      onAdd: () => 'added' as const,
    }),
  )
}

test('у полей видимые имена, а не только плейсхолдеры (WCAG 3.3.2)', () => {
  const html = render(false)

  assert.equal((html.match(/<label/g) ?? []).length >= 2, true)
})

test('автодополнение объявлено как combobox', () => {
  const html = render(false)

  assert.match(html, /aria-autocomplete|role="combobox"|aria-expanded/)
})

test('заполненная корзина объясняется текстом, а не только отключённой кнопкой', () => {
  const html = render(true)

  assert.match(html, /Mission limit reached/)
})
