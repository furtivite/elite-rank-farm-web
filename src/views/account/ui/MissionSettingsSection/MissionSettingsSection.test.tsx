import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MissionSettingsSection } from '@/views/account/ui/MissionSettingsSection/MissionSettingsSection'

function render(): string {
  return renderToStaticMarkup(React.createElement(MissionSettingsSection))
}

test('обе настройки видны в кабинете', () => {
  const html = render()

  assert.match(html, /Add missions manually/)
  assert.match(html, /Do not count manually added ones/)
})

test('на сервере — умолчания: ручной ввод включён, учёт включён', () => {
  const html = render()

  assert.match(html, /checked=""[^>]*\/><span class="flex flex-col"><span>Add missions/)
})

test('вторая настройка неактивна, пока ручной ввод выключен', () => {
  const html = render()

  assert.doesNotMatch(html, /disabled=""/)
})

test('у каждой настройки сказано, что она делает', () => {
  const html = render()

  assert.match(html, /the mission list mirrors the game exactly/)
  assert.match(html, /limit of 20 slots then does not apply/)
})

test('сказано и что скрывается, и что не удаляется (70.3)', () => {
  const html = render()

  assert.match(html, /all your own entries are hidden/)
  assert.match(html, /not deleted and come back/)
})
