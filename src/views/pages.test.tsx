import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ThemeProvider } from '@/shared/lib/theme'
import { AccountPage } from '@/views/account'
import { BlockedBasesPage } from '@/views/blocked-bases'
import { HomePage } from '@/views/home'
import { PasswordResetPage } from '@/views/password-reset'

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(React.createElement(ThemeProvider, null, node))
}
const pages = [
  { name: 'HomePage', node: React.createElement(HomePage) },
  { name: 'BlockedBasesPage', node: React.createElement(BlockedBasesPage) },
  { name: 'AccountPage', node: React.createElement(AccountPage) },
  { name: 'PasswordResetPage', node: React.createElement(PasswordResetPage) },
]

for (const page of pages) {
  test(`${page.name} рендерится первым кадром`, () => {
    const html = render(page.node)

    assert.equal(html.length > 0, true)
    assert.match(html, /<h2/)
  })

  test(`${page.name} даёт пропустить навигацию`, () => {
    const html = render(page.node)

    assert.match(html, /<main/)
  })
}

test('в кабинете нет колонки настроек (45.10)', () => {
  const html = render(React.createElement(AccountPage))

  assert.doesNotMatch(html, /aria-controls="settings-column"/)
})

test('на главной колонка настроек есть', () => {
  const html = render(React.createElement(HomePage))

  assert.match(html, /aria-controls=/)
})

test('демо-панель не показывается, пока не известно, кто вошёл (62)', () => {
  const html = render(React.createElement(HomePage))

  assert.doesNotMatch(html, /Демо-состояния/)
})

test('оговорка о штрафах — одна на страницу навигатора (73.4)', () => {
  const html = render(React.createElement(HomePage))
  const notes = html.match(/no mark does not mean there are no fines/g) ?? []

  assert.equal(notes.length, 1)
  assert.ok(html.indexOf('no mark does not mean') < html.indexOf('id="main-content"'))
})
