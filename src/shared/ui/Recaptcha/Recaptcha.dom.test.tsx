import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { Recaptcha } from '@/shared/ui/Recaptcha'

const REAL = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

afterEach(() => {
  if (REAL === undefined) {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  } else {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = REAL
  }

  document.getElementById('recaptcha-api')?.remove()
})

test('без ключа виджет говорит, что капча не настроена', async () => {
  delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  const { html } = await renderInDom(React.createElement(Recaptcha, { onToken: () => {} }))

  assert.match(html(), /captcha is not configured/i)
  assert.equal(
    document.getElementById('recaptcha-api'),
    null,
    'без ключа сторонний скрипт грузить незачем',
  )
})

test('с ключом грузится один скрипт, с явным рендером', async () => {
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = '6LcRealKeyExample'

  const first = await renderInDom(React.createElement(Recaptcha, { onToken: () => {} }))
  const second = await renderInDom(React.createElement(Recaptcha, { onToken: () => {} }))

  const scripts = document.querySelectorAll('#recaptcha-api')
  assert.equal(scripts.length, 1, 'две формы на экране не должны грузить скрипт дважды')

  const src = scripts[0]?.getAttribute('src') ?? ''
  assert.match(src, /^https:\/\/www\.google\.com\/recaptcha\/api\.js\?/)
  assert.match(src, /render=explicit/, 'страница статическая: к автопоиску по разметке мы опоздали')

  assert.match(first.html(), /Loading the captcha/i)

  first.unmount()
  second.unmount()
})
