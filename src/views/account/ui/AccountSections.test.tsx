import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AgentSection } from '@/views/account/ui/AgentSection/AgentSection'
import { OtherSessionsSection } from '@/views/account/ui/OtherSessionsSection/OtherSessionsSection'
import { SignedIn } from '@/views/account/ui/SignedIn/SignedIn'

test('сказано, что ключ показывается один раз', () => {
  const html = renderToStaticMarkup(React.createElement(AgentSection, { isTestUser: false }))

  assert.match(html, /<button/)
  assert.match(html, /shown once/)
  assert.doesNotMatch(html, /disabled=""/)
})

test('тестовой записи кнопка отключена с объяснением, а не спрятана (60)', () => {
  const html = renderToStaticMarkup(React.createElement(AgentSection, { isTestUser: true }))

  assert.match(html, /disabled=""/)
  assert.match(html, /aria-describedby="agent-token-disabled"/)
  assert.match(html, /id="agent-token-disabled"/)
})

test('разлогинивание чужих сессий спрашивает подтверждение', () => {
  const html = renderToStaticMarkup(React.createElement(OtherSessionsSection))

  assert.match(html, /<button/)
  assert.doesNotMatch(html, /Да, /)
})

function signedIn(
  features: string[],
  user: Record<string, unknown> = { login: 'cmdr', email: 'c@example.com', isTestUser: false },
): string {
  return renderToStaticMarkup(
    React.createElement(SignedIn, {
      session: {
        user,
        errorMessage: null,
        signOut: () => {},
      },
      commander: {
        status: 'success',
        data: {
          state: {
            commanderName: 'CMDR',
            currentSystem: { name: 'Ngalinn', x: 0, y: 0, z: 0 },
            currentStation: null,
            ship: 'Python',
            jumpRangeLy: 30,
            imperialRank: 5,
            imperialProgress: 40,
            imperialProgressAt: '2026-09-06T10:00:00Z',
            federalRank: 3,
            federalProgress: 100,
            federalProgressAt: '2026-09-06T10:00:00Z',
            observedAt: '2026-09-06T10:00:00Z',
          },
          features,
        },
      },
    } as unknown as React.ComponentProps<typeof SignedIn>),
  )
}

test('обе галочки корзины видны (70.3, 70.9)', () => {
  const html = signedIn([])

  assert.match(html, />Missions</)
  assert.match(html, /Add missions manually/)
  assert.match(html, /Do not count manually added ones/)
})

test('на десктопе кабинет в две колонки, слева данные (97)', () => {
  const html = signedIn([])

  assert.match(html, /lg:grid-cols-2/)

  const commander = html.indexOf('Last commander state')
  const galaxy = html.indexOf('Galaxy Data')
  const account = html.indexOf('>Account<')

  assert.ok(commander >= 0 && galaxy >= 0 && account >= 0)
  assert.ok(commander < galaxy, 'Galaxy Data идёт под командиром')
  assert.ok(galaxy < account, 'левая колонка целиком раньше правой')
})

test('тестовой записи прочие сессии закрывать нельзя (60.3)', () => {
  const html = signedIn([], { login: 'test', email: 't@example.com', isTestUser: true })

  assert.doesNotMatch(html, /End other sessions/)
  assert.doesNotMatch(html, /Change password/i)
})

test('кнопки «разлогинить всех тестовых» у обычного пользователя нет (86.10)', () => {
  assert.doesNotMatch(signedIn([]), /Sign out all test accounts/)
})

test('у админа она есть', () => {
  const html = signedIn([], {
    login: 'root',
    email: 'r@example.com',
    isTestUser: false,
    isAdmin: true,
  })

  assert.match(html, /Sign out all test accounts/)
})
