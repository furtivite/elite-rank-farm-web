import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderInDom, type RenderedInDom } from '@/shared/test/renderInDom'
import { PasswordSection } from '@/views/account/ui/PasswordSection/PasswordSection'

function render(): string {
  return renderToStaticMarkup(React.createElement(PasswordSection))
}

test('спрашивает текущий пароль, а не только новый', () => {
  const html = render()

  assert.match(html, /Current password/)
  assert.match(html, /New password/)
  assert.match(html, /Repeat the new password/)
})

test('поля размечены для менеджера паролей', () => {
  const html = render()

  assert.match(html, /autocomplete="current-password"/i)
  assert.equal((html.match(/autocomplete="new-password"/gi) ?? []).length, 2)
})

test('минимальная длина и последствия названы заранее', () => {
  const html = render()

  assert.match(html, /minlength="12"/i)
  assert.match(html, /all other sessions end/)
  assert.match(html, /five minutes later/)
})

test('форма свёрнута: пароль меняют редко', () => {
  const html = render()

  assert.match(html, /<details/)
  assert.doesNotMatch(html, /<details open/)
})

const realFetch = global.fetch

afterEach(() => {
  global.fetch = realFetch
})

async function openForm(view: RenderedInDom): Promise<void> {
  const details = view.container.querySelector('details')
  if (details !== null) {
    details.open = true
    await view.settle()
  }
}

test('несовпадение нового пароля и повтора видно до запроса (82.13)', async () => {
  let asked = false
  global.fetch = (async () => {
    asked = true
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
  }) as unknown as typeof fetch

  const view = await renderInDom(React.createElement(PasswordSection))
  await openForm(view)

  const fields = Array.from(
    view.container.querySelectorAll('input[type="password"]'),
  ) as HTMLInputElement[]
  assert.equal(fields.length, 3, 'текущий, новый и повтор')

  await view.type(fields[0], 'current-password-000')
  await view.type(fields[1], 'brand-new-password-1')
  await view.type(fields[2], 'brand-new-password-2')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.match(view.html(), /do not match/i)
  assert.equal(asked, false, 'заведомо негодную пару на сервер не отправляем')
  view.unmount()
})

test('совпавшая пара уходит на сервер вместе с текущим паролем (82.13)', async () => {
  let sent: { currentPassword: string; newPassword: string } | null = null
  global.fetch = (async (_url: string, init?: RequestInit) => {
    sent = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
  }) as unknown as typeof fetch

  const view = await renderInDom(React.createElement(PasswordSection))
  await openForm(view)

  const fields = Array.from(
    view.container.querySelectorAll('input[type="password"]'),
  ) as HTMLInputElement[]
  await view.type(fields[0], 'current-password-000')
  await view.type(fields[1], 'brand-new-password-1')
  await view.type(fields[2], 'brand-new-password-1')
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.deepEqual(sent, {
    currentPassword: 'current-password-000',
    newPassword: 'brand-new-password-1',
  })
  view.unmount()
})

test('после успеха поля очищаются: пароль не остаётся в форме (82.13)', async () => {
  global.fetch = (async () =>
    new Response(JSON.stringify({ status: 'ok' }), { status: 200 })) as unknown as typeof fetch

  const view = await renderInDom(React.createElement(PasswordSection))
  await openForm(view)

  const fields = Array.from(
    view.container.querySelectorAll('input[type="password"]'),
  ) as HTMLInputElement[]
  for (const field of fields) {
    await view.type(field, 'brand-new-password-1')
  }
  await view.click(view.container.querySelector('button[type="submit"]'))

  assert.deepEqual(
    fields.map((field) => field.value),
    ['', '', ''],
  )
  view.unmount()
})

test('подсказка про сброс по почте показывается только когда он работает (99.3)', async () => {
  const off = await renderInDom(React.createElement(PasswordSection))
  await openForm(off)
  assert.doesNotMatch(off.html(), /reset it by email/i)
  off.unmount()

  const on = await renderInDom(React.createElement(PasswordSection, { passwordResetEnabled: true }))
  await openForm(on)
  assert.match(on.html(), /reset it by email/i)
  assert.match(on.html(), /href="\.\.\/reset\/"/, 'ведёт на ту же страницу, что ссылка на входе')
  on.unmount()
})
