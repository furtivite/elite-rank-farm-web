import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { UseSessionResult } from '@/entities/session'
import { ThemeProvider } from '@/shared/lib/theme'
import { AppShell } from '@/widgets/app-shell'

const session = {
  status: 'user',
  user: { login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false },
  cachedLogin: null,
  registrationEnabled: false,
  passwordResetEnabled: false,
  errorMessage: null,
  isBusy: false,
  signIn: async () => true,
  signOut: async () => {},
} as unknown as UseSessionResult

const commander = {
  status: 'guest',
  data: null,
  progress: null,
  errorMessage: null,
} as UseCommanderStateResult

function render(withAside: boolean): string {
  return renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(AppShell, {
        activeNav: 'home' as const,
        commander,
        session,
        ...(withAside ? { aside: React.createElement('div', null, 'корзина') } : {}),
        children: React.createElement('div', null, 'выдача'),
      } as never),
    ),
  )
}

test('переходы собраны в группу с именем (89)', () => {
  const html = render(true)

  assert.match(html, /aria-label="Page navigation"/)
  assert.match(html, /To settings/)
  assert.match(html, /To missions/)
})

test('ссылки на скрытую колонку нет: вести некуда', () => {
  const html = render(false)

  assert.doesNotMatch(html, /To missions/)
  assert.doesNotMatch(html, /id="basket-column"/)
})

test('каждая колонка принимает фокус', () => {
  const html = render(true)

  for (const id of ['settings-column', 'results-column', 'basket-column']) {
    const block = html.slice(html.indexOf(`id="${id}"`), html.indexOf(`id="${id}"`) + 200)
    assert.match(block, /tabindex="-1"/, `${id} не принимает фокус`)
  }
})

test('у колонок есть имена — они попадают в список ориентиров', () => {
  const html = render(true)

  assert.match(html, /aria-label="Settings"/)
  assert.match(html, /aria-label="Missions"/)
})

test('подвал говорит, что числа — оценка (THIRD-PARTY.md)', () => {
  const html = render(true)

  assert.match(html, /estimates — check them in game/)
  assert.doesNotMatch(
    html,
    /takes no responsibility/,
    'длинная часть живёт на странице приватности, в подвале её быть не должно',
  )
})
