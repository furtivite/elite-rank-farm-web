import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { UnsubscribePage } from '@/views/unsubscribe'

const realFetch = global.fetch

function recordFetch(): { calls: Array<{ url: string; body: unknown }> } {
  const calls: Array<{ url: string; body: unknown }> = []

  global.fetch = (async (url: string, init?: { body?: string }) => {
    calls.push({
      url: String(url),
      body: init?.body === undefined ? null : JSON.parse(init.body),
    })

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
  }) as unknown as typeof fetch

  return { calls }
}

afterEach(() => {
  global.fetch = realFetch
  window.history.replaceState({}, '', '/')
})

test('по полной ссылке человек отписан сразу, без подтверждения', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=7&sig=abc123')
  const seen = recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))

  assert.equal(seen.calls.length, 1, 'ровно один запрос на открытие')
  assert.match(seen.calls[0]?.url ?? '', /\/api\/auth\/unsubscribe$/)
  assert.deepEqual(seen.calls[0]?.body, { user: 7, signature: 'abc123' })
  assert.match(view.html(), /You are unsubscribed/)
  view.unmount()
})

test('сказано, что письмо сброса пароля всё равно придёт', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=7&sig=abc123')
  recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))

  assert.match(view.html(), /password reset/i)
  view.unmount()
})

test('неполная ссылка ничего не отписывает и объясняет себя', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=7')
  const seen = recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))

  assert.equal(seen.calls.length, 0, 'без подписи на сервер идти незачем')
  assert.match(view.html(), /not complete/i)
  assert.doesNotMatch(view.html(), /You are unsubscribed/)
  view.unmount()
})

test('чужой формат id тоже считается неполной ссылкой', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=nope&sig=abc123')
  const seen = recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))

  assert.equal(seen.calls.length, 0)
  assert.match(view.html(), /not complete/i)
  view.unmount()
})

test('ссылка возврата подписки зовёт свой адрес, а не тот же (99.5)', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=7&sig=abc123')
  const seen = recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))
  await view.click(view.container.querySelector('button[type="button"]:not([aria-pressed])'))

  const urls = seen.calls.map((call) => call.url)
  assert.equal(urls.length, 2, 'открытие отписало, нажатие вернуло подписку')
  assert.match(urls[1] ?? '', /\/api\/auth\/resubscribe$/)
  assert.deepEqual(seen.calls[1]?.body, { user: 7, signature: 'abc123' })
  assert.match(view.html(), /subscribed again/i)
  view.unmount()
})

test('переключатель языка на странице есть — как на гостевой главной', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=7&sig=abc123')
  recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))

  const switches = view.container.querySelectorAll('button[aria-pressed]')
  assert.equal(switches.length, 2, 'два языка, оба кнопками')
  view.unmount()
})

test('обе языковые версии лежат в разметке: гость видит их до гидратации', async () => {
  window.history.replaceState({}, '', '/unsubscribe/?u=7&sig=abc123')
  recordFetch()

  const view = await renderInDom(React.createElement(UnsubscribePage))

  assert.match(view.html(), /data-lang="en"/)
  assert.match(view.html(), /data-lang="ru"/)
  assert.match(view.html(), /Вы отписались/)
  view.unmount()
})
