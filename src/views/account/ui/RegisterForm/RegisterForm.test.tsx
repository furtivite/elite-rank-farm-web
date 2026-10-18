import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { renderInDom, type RenderedInDom } from '@/shared/test/renderInDom'
import { RegisterForm } from '@/views/account/ui/RegisterForm/RegisterForm'

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
})

function form(onRegistered = (_login: string, _password: string) => {}): React.ReactElement {
  return React.createElement(RegisterForm, { onRegistered, onCancel: () => {} })
}

function fields(view: RenderedInDom): {
  login: HTMLInputElement
  email: HTMLInputElement
  password: HTMLInputElement
  repeat: HTMLInputElement
} {
  const passwords = Array.from(
    view.container.querySelectorAll('input[type="password"]'),
  ) as HTMLInputElement[]

  return {
    login: view.container.querySelector('input[autocomplete="username"]') as HTMLInputElement,
    email: view.container.querySelector('input[type="email"]') as HTMLInputElement,
    password: passwords[0],
    repeat: passwords[1],
  }
}

test('спрашивает логин, почту, пароль и подтверждение', async () => {
  const view = await renderInDom(form())
  const { login, email, password, repeat } = fields(view)

  assert.notEqual(login, null)
  assert.notEqual(email, null)
  assert.equal(
    view.container.querySelectorAll('input[type="password"]').length,
    2,
    'пользователь просил пароль и подтверждение',
  )
  assert.notEqual(password, undefined)
  assert.notEqual(repeat, undefined)
  view.unmount()
})

test('несовпадение пароля и подтверждения видно до запроса (82.13)', async () => {
  let asked = false
  global.fetch = (async () => {
    asked = true
    return new Response(JSON.stringify({ status: 'ok' }), { status: 201 })
  }) as unknown as typeof fetch

  const view = await renderInDom(form())
  const { login, email, password, repeat } = fields(view)
  await view.type(login, 'commander')
  await view.type(email, 'commander@example.test')
  await view.type(password, 'long-enough-password-1')
  await view.type(repeat, 'long-enough-password-2')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.match(view.html(), /do not match/i)
  assert.equal(asked, false, 'заведомо негодную пару на сервер не отправляем')
  view.unmount()
})

test('про пароль говорится раньше, чем про капчу (82.13)', async () => {
  const view = await renderInDom(form())
  const { login, email, password, repeat } = fields(view)
  await view.type(login, 'commander')
  await view.type(email, 'commander@example.test')
  await view.type(password, 'long-enough-password-1')
  await view.type(repeat, 'long-enough-password-2')
  await view.click(view.container.querySelector('button[type="submit"]'))

  const alert = view.container.querySelector('[role="alert"]')?.textContent ?? ''
  assert.match(alert, /do not match/i)
  assert.doesNotMatch(alert, /captcha/i)
  view.unmount()
})

test('совпавшая пара без галочки капчи просит галочку, а не идёт на сервер (82.13)', async () => {
  let asked = false
  global.fetch = (async () => {
    asked = true
    return new Response(JSON.stringify({ status: 'ok' }), { status: 201 })
  }) as unknown as typeof fetch

  const view = await renderInDom(form())
  const { login, email, password, repeat } = fields(view)
  await view.type(login, 'commander')
  await view.type(email, 'commander@example.test')
  await view.type(password, 'long-enough-password-1')
  await view.type(repeat, 'long-enough-password-1')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.match(view.html(), /Tick the captcha box/i)
  assert.equal(asked, false, 'без токена капчи сервер всё равно откажет — незачем спрашивать')
  view.unmount()
})
