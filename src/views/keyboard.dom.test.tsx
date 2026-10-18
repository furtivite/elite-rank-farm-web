import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { ThemeProvider } from '@/shared/lib/theme'
import { AccountPage } from '@/views/account'
import { BlockedBasesPage } from '@/views/blocked-bases'
import { HomePage } from '@/views/home'
import { PasswordResetPage } from '@/views/password-reset'

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]'

const PAGES = [
  ['HomePage', () => React.createElement(HomePage)],
  ['BlockedBasesPage', () => React.createElement(BlockedBasesPage)],
  ['AccountPage', () => React.createElement(AccountPage)],
  ['PasswordResetPage', () => React.createElement(PasswordResetPage)],
] as const

function withoutNetwork(): () => void {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response('[]', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch

  return () => {
    globalThis.fetch = original
  }
}

for (const [name, page] of PAGES) {
  test(`${name}: раскрытое доступно с клавиатуры (118.6)`, async () => {
    const restore = withoutNetwork()

    try {
      const view = await renderInDom(React.createElement(ThemeProvider, null, page()))

      for (const control of Array.from(
        view.container.querySelectorAll<HTMLElement>('[aria-expanded="false"]'),
      )) {
        await view.click(control)
      }
      for (const details of Array.from(
        view.container.querySelectorAll<HTMLDetailsElement>('details:not([open])'),
      )) {
        details.open = true
        await view.settle()
      }

      const container = view.container

      assert.deepEqual(
        Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
          .filter((element) => element.closest('[aria-hidden="true"], [inert]') !== null)
          .map((element) => element.outerHTML.slice(0, 120)),
        [],
      )

      assert.deepEqual(
        Array.from(container.querySelectorAll<HTMLElement>('[tabindex]'))
          .filter((element) => Number(element.getAttribute('tabindex')) > 0)
          .map((element) => element.outerHTML.slice(0, 120)),
        [],
      )

      assert.deepEqual(
        Array.from(container.querySelectorAll<HTMLElement>('[aria-expanded]'))
          .filter((element) => !['BUTTON', 'SUMMARY', 'A', 'INPUT'].includes(element.tagName))
          .map((element) => element.tagName),
        [],
      )

      assert.deepEqual(
        Array.from(container.querySelectorAll<HTMLElement>('[aria-controls]'))
          .map((element) => element.getAttribute('aria-controls') ?? '')
          .filter((id) => id !== '' && container.querySelector(`[id="${id}"]`) === null),
        [],
      )

      view.unmount()
    } finally {
      restore()
    }
  })
}
