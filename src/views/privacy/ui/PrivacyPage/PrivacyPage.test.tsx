import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { STORAGE_NOTES } from '@/shared/config/storageKeys'
import { createTranslate } from '@/shared/lib/i18n'
import { ThemeProvider } from '@/shared/lib/theme'
import { PrivacyPage } from '@/views/privacy'

function markup(): string {
  return renderToStaticMarkup(
    React.createElement(ThemeProvider, null, React.createElement(PrivacyPage)),
  )
}

test('перечень браузерного хранения полон — все записи из кода (53.4)', () => {
  const html = markup()
  const t = createTranslate('en')

  const missing = STORAGE_NOTES.filter((note) => !html.includes(t(note.what))).map(
    (note) => note.key,
  )

  assert.deepEqual(missing, [], 'эти ключи хранятся, но на странице не названы')
  assert.ok(STORAGE_NOTES.length >= 20, `записей всего ${STORAGE_NOTES.length} — список усох?`)
})

test('cookie названа по имени и вместе со сроком (83.3)', () => {
  const html = markup()

  assert.match(html, /elite_session/)
  assert.match(html, /30 days/)
})

test('серверные данные названы, и сказано, что пароля там нет', () => {
  const html = markup()

  assert.match(html, /password hash/i)
  assert.match(html, /never the password itself/i)
})

test('сторонний сервис назван по имени (99.6)', () => {
  const html = markup()

  assert.match(html, /Google reCAPTCHA/)
  assert.match(html, /google\.com/)
  assert.match(html, /policies\.google\.com/)
})

test('сказано, как удалить: и браузер, и учётная запись', () => {
  const html = markup()

  assert.match(html, /clear the site data/i)
  assert.match(html, /elite@frtvt\.com/)
})

test('фанатская оговорка и происхождение чисел не потерялись', () => {
  const html = markup()

  assert.match(html, /Not affiliated with or endorsed by Frontier Developments plc/)
  assert.match(html, /estimates/i)
  assert.match(html, /Frontier publishes neither the formulas nor the drive constants/)
  assert.match(html, /takes no responsibility for in-game decisions/)
})

test('ни один раздел навигации не подсвечен: страница вне разделов', () => {
  const html = markup()

  assert.doesNotMatch(html, /aria-current="page"/)
})
