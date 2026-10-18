import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { renderInDom, type RenderedInDom } from '@/shared/test/renderInDom'
import { ThemeProvider } from '@/shared/lib/theme'
import { PasswordResetPage } from '@/views/password-reset'

function page() {
  return React.createElement(ThemeProvider, null, React.createElement(PasswordResetPage))
}

const realFetch = global.fetch

async function fillPasswords(view: RenderedInDom, value: string): Promise<void> {
  for (const field of passwordFields(view)) {
    await view.type(field, value)
  }
}

function passwordFields(view: RenderedInDom): HTMLInputElement[] {
  return Array.from(view.container.querySelectorAll('input[type="password"]')) as HTMLInputElement[]
}

function guestFetch(handler: (url: string) => Response | null): typeof fetch {
  return (async (url: string) => {
    const answer = handler(String(url))
    return (
      answer ??
      new Response(JSON.stringify({ status: 'ok', user: null, registrationEnabled: false }), {
        status: 200,
      })
    )
  }) as unknown as typeof fetch
}

afterEach(() => {
  global.fetch = realFetch
  window.history.replaceState({}, '', '/')
})

test('без токена показывается форма запроса письма, а не тупик (99.6)', async () => {
  window.history.replaceState({}, '', '/reset/')
  const view = await renderInDom(page())

  assert.notEqual(view.container.querySelector('input[type="email"]'), null)
  assert.equal(
    view.container.querySelector('input[type="password"]'),
    null,
    'без ссылки из письма задавать пароль нечему',
  )
  view.unmount()
})

test('в сборке без ключа капчи форма говорит об этом вслух', async () => {
  window.history.replaceState({}, '', '/reset/')
  const view = await renderInDom(page())

  assert.match(view.html(), /not configured/i)
  view.unmount()
})

test('с токеном показываются два поля: пароль и подтверждение (99.6)', async () => {
  window.history.replaceState({}, '', '/reset/?token=abc123')
  const view = await renderInDom(page())

  const fields = passwordFields(view)
  assert.equal(fields.length, 2, 'пользователь просил «новый пароль и подтверждение»')
  view.unmount()
})

test('мёртвая ссылка объясняет себя, а не молчит', async () => {
  window.history.replaceState({}, '', '/reset/?token=stale')
  global.fetch = guestFetch((url) =>
    url.includes('password-reset-complete')
      ? new Response(JSON.stringify({ message: 'This link is no longer valid.' }), { status: 400 })
      : null,
  )

  const view = await renderInDom(page())
  await fillPasswords(view, 'new-password-123')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.match(view.html(), /no longer valid/i)
  view.unmount()
})

test('ошибка объявляется как alert (WCAG 3.3.1)', async () => {
  window.history.replaceState({}, '', '/reset/?token=stale')
  global.fetch = guestFetch((url) =>
    url.includes('password-reset-complete')
      ? new Response(JSON.stringify({ message: 'Nope.' }), { status: 400 })
      : null,
  )

  const view = await renderInDom(page())
  await fillPasswords(view, 'whatever-123')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.notEqual(view.container.querySelector('[role="alert"]'), null)
  view.unmount()
})

test('несовпадение пароля и подтверждения видно до запроса (99.6, 82.13)', async () => {
  window.history.replaceState({}, '', '/reset/?token=abc123')
  let asked = false
  global.fetch = guestFetch((url) => {
    if (url.includes('password-reset-complete')) {
      asked = true
    }
    return null
  })

  const view = await renderInDom(page())
  const [password, repeat] = passwordFields(view)
  await view.type(password, 'correct-horse-battery')
  await view.type(repeat, 'correct-horse-batteru')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.match(view.html(), /do not match/i)
  assert.equal(asked, false, 'заведомо негодную пару на сервер не отправляем')
  view.unmount()
})

test('совпавшая пара уходит на сервер, и уходит введённый пароль (99.6, 82.13)', async () => {
  window.history.replaceState({}, '', '/reset/?token=abc123')
  let sent: string | null = null
  global.fetch = (async (url: string, init?: RequestInit) => {
    if (String(url).includes('password-reset-complete')) {
      const body: unknown = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
      sent = String((body as { password?: unknown }).password)
      return new Response(JSON.stringify({ status: 'ok', message: 'Password changed.' }), {
        status: 200,
      })
    }
    return new Response(JSON.stringify({ status: 'ok', user: null, registrationEnabled: false }), {
      status: 200,
    })
  }) as unknown as typeof fetch

  const view = await renderInDom(page())
  await fillPasswords(view, 'correct-horse-battery')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.equal(sent, 'correct-horse-battery')
  assert.match(view.html(), /Password changed/i)
  view.unmount()
})
