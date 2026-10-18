import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { UseSessionResult } from '@/entities/session'
import { ThemeProvider } from '@/shared/lib/theme'
import { AppHeader } from '@/widgets/app-header'

function session(overrides: Partial<UseSessionResult> = {}): UseSessionResult {
  return {
    status: 'unknown',
    user: null,
    cachedLogin: null,
    registrationEnabled: false,
    passwordResetEnabled: false,
    loginCaptchaRequired: false,
    errorMessage: null,
    isBusy: false,
    signIn: async () => ({ ok: true }),
    signOut: async () => {},
    ...overrides,
  }
}

function markup(node: React.ReactElement): string {
  return renderToStaticMarkup(React.createElement(ThemeProvider, null, node))
}

function render(overrides: Partial<UseSessionResult> = {}, settings = true): string {
  return markup(
    React.createElement(AppHeader, {
      activeNav: 'home' as const,
      session: session(overrides),
      settings: settings
        ? { isVisible: true, onToggle: () => {}, controlsId: 'settings-column' }
        : undefined,
    }),
  )
}

test('гостю кнопка предлагает войти', () => {
  const html = render({ status: 'guest' })

  assert.match(html, />Sign in</)
})

test('вошедшему показан логин, а не почта (54)', () => {
  const html = render({
    status: 'user',
    user: { login: 'egor', email: 'egor@example.com', isTestUser: false, isAdmin: false },
  })

  assert.match(html, />egor</)
  assert.doesNotMatch(html, /egor@example\.com/)
})

test('до ответа сервера подпись нейтральна, а не «Войти» (45.9)', () => {
  const html = render({ status: 'unknown' })

  assert.match(html, />Account</)
  assert.doesNotMatch(html, />Sign in</)
})

test('логин с прошлого визита виден с первого кадра (45.9)', () => {
  const html = render({ status: 'unknown', cachedLogin: 'egor' })

  assert.match(html, />egor</)
})

test('ширина подписи не зависит от состояния (45.9)', () => {
  for (const state of [
    session({ status: 'guest' }),
    session({
      status: 'user',
      user: { login: 'очень-длинный-логин', email: 'a@b.c', isTestUser: false, isAdmin: false },
    }),
  ]) {
    const html = markup(
      React.createElement(AppHeader, { activeNav: 'home' as const, session: state }),
    )
    assert.match(html, /w-24 truncate/)
  }
})

test('кнопка настроек имеет скрытое имя и говорит, чем управляет', () => {
  const html = render({ status: 'guest' })

  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /aria-controls="settings-column"/)
  assert.match(html, /sr-only">Hide settings/)
})

test('на экране без колонки кнопки настроек нет', () => {
  const html = render({ status: 'guest' }, false)

  assert.doesNotMatch(html, /aria-controls="settings-column"/)
})

test('текущий раздел помечен для screen reader', () => {
  const html = render({
    status: 'user',
    user: { login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false },
  } as Partial<UseSessionResult>)

  assert.match(html, /aria-current="page"/)
})

test('гостю разделы заперты, вход остаётся открытым (110.2)', () => {
  const html = render({ status: 'guest' })

  assert.equal((html.match(/aria-disabled="true"/g) ?? []).length, 3, 'три раздела заперты')
  assert.doesNotMatch(html, /sr-only">[^<]*sign in to open/)
  const reason = /<span id="([^"]+)"[^>]*>sign in to open<\/span>/.exec(html)
  assert.ok(reason, html)
  assert.equal(html.split(`aria-describedby="${reason[1]}"`).length - 1, 3)
  assert.doesNotMatch(html, /<a[^>]*href="\/blocked"/)
  assert.match(html, /href="\/account"/)
})

test('вошедшему разделы открыты', () => {
  const html = render({
    status: 'user',
    user: { login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false },
  } as Partial<UseSessionResult>)

  assert.doesNotMatch(html, /aria-disabled="true"/)
  assert.match(html, /href="\/blocked"/)
})

test('до ответа сервера решает логин с прошлого визита (45.9, 110)', () => {
  const html = render({ status: 'unknown', cachedLogin: 'cmdr' } as Partial<UseSessionResult>)

  assert.doesNotMatch(html, /aria-disabled="true"/)
})

test('логин из 16 символов помещается целиком (93)', () => {
  const longest = 'abcdefghij123456'
  assert.equal(longest.length, 16)

  const html = render({
    status: 'user',
    user: { login: longest, email: 'a@b.c', isTestUser: false, isAdmin: false },
  } as Partial<UseSessionResult>)

  assert.match(html, new RegExp(longest))
  assert.match(html, /sm:w-\[16ch\]/)
  assert.match(html, /text-center/)
})

test('кнопка кабинета обведена акцентной рамкой (93)', () => {
  assert.match(render(), /border-aubergine-700/)
})

test('лого стоит слева от названия и ростом со строку (110)', () => {
  const html = render({
    status: 'user',
    user: { login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false },
  } as Partial<UseSessionResult>)
  const heading = /<h1[\s\S]*?<\/h1>/.exec(html)

  assert.ok(heading, 'название обязано остаться h1')
  assert.match(heading[0], /station_black\.png/)
  assert.match(heading[0], /station_white\.png/)
  assert.match(heading[0], /size-\[1em\]/)
  assert.match(heading[0], /class="[^"]*gap-1[^"]*"/)
  assert.equal((heading[0].match(/alt=""/g) ?? []).length, 2)
  assert.equal((heading[0].match(/role="presentation"/g) ?? []).length, 2)
})

test('кнопка колонки не исчезает, а становится неактивной (110)', () => {
  const html = render()
  const group = /<div role="group" aria-label="Appearance"[\s\S]*?<\/div>/.exec(html)

  assert.ok(group, 'группа кнопок обязана быть на месте всегда')
  assert.equal((group[0].match(/<button/g) ?? []).length, 2, 'обе кнопки на месте')
  assert.match(group[0], /disabled=""/)
  assert.match(group[0], /No search on this page|No settings on this page/)
})

test('гостю название ведёт на главную, вошедшему — нет (110.2)', () => {
  const guest = /<h1[\s\S]*?<\/h1>/.exec(render({ status: 'guest' }))
  const user = /<h1[\s\S]*?<\/h1>/.exec(
    render({
      status: 'user',
      user: { login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false },
    } as Partial<UseSessionResult>),
  )

  assert.ok(guest && user)
  assert.match(guest[0], /<a [^>]*href="\/"/)
  assert.doesNotMatch(user[0], /<a /)
  assert.match(guest[0], /Elite<\/a>/)
})
