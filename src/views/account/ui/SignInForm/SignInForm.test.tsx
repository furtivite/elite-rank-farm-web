import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { UseSessionResult } from '@/entities/session'
import { SignInForm } from '@/views/account/ui/SignInForm/SignInForm'
import { SignedIn } from '@/views/account/ui/SignedIn/SignedIn'
import type { UseCommanderStateResult } from '@/entities/commander-state'

function session(overrides: Partial<UseSessionResult> = {}): UseSessionResult {
  return {
    status: 'guest',
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

const commander = {
  status: 'guest',
  data: null,
  progress: null,
  errorMessage: null,
  isSignedIn: true,
  refresh: () => {},
} as UseCommanderStateResult

test('форма входа просит логин, а не почту (54)', () => {
  const html = renderToStaticMarkup(React.createElement(SignInForm, { session: session() }))

  assert.match(html, /Login/)
  assert.doesNotMatch(html, /<label[^>]*>Email/)
  assert.match(html, /autocomplete="username"/i)
  assert.match(html, /autocomplete="current-password"/i)
})

test('закрытая регистрация объясняется, а не молчит', () => {
  const html = renderToStaticMarkup(React.createElement(SignInForm, { session: session() }))

  assert.match(html, /Registration is closed/)
})

test('ошибка входа объявляется через role="alert" (WCAG 3.3.1)', () => {
  const html = renderToStaticMarkup(
    React.createElement(SignInForm, {
      session: session({ errorMessage: 'Wrong login or password.' }),
    }),
  )

  assert.match(html, /role="alert"/)
  assert.match(html, /Wrong login or password/)
})

test('обычная запись видит почту и обе опасные секции', () => {
  const html = renderToStaticMarkup(
    React.createElement(SignedIn, {
      session: session({
        status: 'user',
        user: { login: 'egor', email: 'egor@example.com', isTestUser: false, isAdmin: false },
      }),
      commander,
    }),
  )

  assert.match(html, /egor@example.com/)
  assert.match(html, /End other sessions/)
  assert.match(html, /Issue key/)
})

test('тестовая запись: маска вместо почты и запреты (60)', () => {
  const html = renderToStaticMarkup(
    React.createElement(SignedIn, {
      session: session({
        status: 'user',
        user: { login: 'test', email: '·········@······.com', isTestUser: true, isAdmin: false },
      }),
      commander,
    }),
  )

  assert.match(html, /·········@······\.com/)
  assert.match(html, /Test account/)
  assert.doesNotMatch(html, /End other sessions/)
  assert.match(html, /disabled=""/)
  assert.match(html, /Issuing a key is disabled/)
})

test('галочка «не выходить» выключена по умолчанию (83.2)', () => {
  const html = renderToStaticMarkup(React.createElement(SignInForm, { session: session() }))

  assert.match(html, /Do not sign me out on this device/)
  assert.doesNotMatch(html, /type="checkbox"[^>]*checked/)
})

test('подпись обещает сессию, а не сохранённый пароль (83.2)', () => {
  const html = renderToStaticMarkup(React.createElement(SignInForm, { session: session() }))

  assert.match(html, /The password is not stored in the browser/)
  assert.doesNotMatch(html, /save (the )?password/i)
})
