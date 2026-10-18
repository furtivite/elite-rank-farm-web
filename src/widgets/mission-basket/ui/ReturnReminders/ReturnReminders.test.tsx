import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReturnReminders } from '@/widgets/mission-basket/ui/ReturnReminders'

const reminder = {
  id: 'r1',
  systemName: 'Ngalinn',
  stationName: 'Gloss Gateway',
  fromStation: 'Kovalyonok Hub',
  createdAt: '2026-09-08T12:00:00Z',
}

const render = (reminders: (typeof reminder)[]) =>
  renderToStaticMarkup(React.createElement(ReturnReminders, { reminders, onDismiss: () => {} }))

test('плашка называет рейс и говорит, куда возвращаться', () => {
  const html = render([reminder])

  assert.match(html, /Return flight/)
  assert.match(html, /Ngalinn · Gloss Gateway/)
})

test('без возвратов блок не занимает места вовсе', () => {
  assert.equal(render([]), '')
})

test('у каждого рейса своя кнопка, и на слух они различимы', () => {
  const second = { ...reminder, id: 'r2', systemName: 'Mainani', stationName: 'Tull Reach' }
  const html = render([reminder, second])

  assert.equal((html.match(/Done/g) ?? []).length, 2)
  assert.match(html, /Gloss Gateway<\/span>/)
  assert.match(html, /Tull Reach/)
})

test('цель нажатия не меньше 44 пикселей (WCAG 2.5.8)', () => {
  assert.match(render([reminder]), /min-h-11/)
})
