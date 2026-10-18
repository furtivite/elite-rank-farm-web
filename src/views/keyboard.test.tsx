import { dom } from '@/shared/test/domEnvironment'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ThemeProvider } from '@/shared/lib/theme'
import { AccountPage } from '@/views/account'
import { BlockedBasesPage } from '@/views/blocked-bases'
import { HomePage } from '@/views/home'
import { PasswordResetPage } from '@/views/password-reset'

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]'

const PAGES = [
  ['HomePage', React.createElement(HomePage)],
  ['BlockedBasesPage', React.createElement(BlockedBasesPage)],
  ['AccountPage', React.createElement(AccountPage)],
  ['PasswordResetPage', React.createElement(PasswordResetPage)],
] as const

function parse(node: React.ReactElement): HTMLElement {
  const host = dom.window.document.createElement('div')
  host.innerHTML = renderToStaticMarkup(React.createElement(ThemeProvider, null, node))
  return host
}

for (const [name, node] of PAGES) {
  test(`${name}: до фокусируемого не спрятан голосом и не выключен (118)`, () => {
    const offenders = Array.from(parse(node).querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => element.closest('[aria-hidden="true"], [inert]') !== null)
      .map((element) => element.outerHTML.slice(0, 120))

    assert.deepEqual(offenders, [])
  })

  test(`${name}: порядок обхода не переставлен руками (118)`, () => {
    const offenders = Array.from(parse(node).querySelectorAll<HTMLElement>('[tabindex]'))
      .filter((element) => Number(element.getAttribute('tabindex')) > 0)
      .map((element) => element.outerHTML.slice(0, 120))

    assert.deepEqual(offenders, [])
  })

  test(`${name}: «раскрыть» живёт на контроле, а не на div (118)`, () => {
    const offenders = Array.from(parse(node).querySelectorAll<HTMLElement>('[aria-expanded]'))
      .filter((element) => !['BUTTON', 'SUMMARY', 'A', 'INPUT'].includes(element.tagName))
      .map((element) => `${element.tagName}: ${element.outerHTML.slice(0, 100)}`)

    assert.deepEqual(offenders, [])
  })

  test(`${name}: ссылки ARIA ведут в существующее (118)`, () => {
    const host = parse(node)
    const offenders = Array.from(host.querySelectorAll<HTMLElement>('[aria-controls]'))
      .map((element) => element.getAttribute('aria-controls') ?? '')
      .filter((id) => id !== '' && host.querySelector(`[id="${id}"]`) === null)

    assert.deepEqual(offenders, [])
  })
}
