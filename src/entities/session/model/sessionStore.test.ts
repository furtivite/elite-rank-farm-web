import assert from 'node:assert/strict'
import { test } from 'node:test'
import '@/shared/test/renderInDom'
import { setSignedIn, setSignedOut } from '@/entities/session/model/sessionStore'
import { getLastCommanderSnapshot, rememberCommander } from '@/shared/lib/lastCommander'

test('вход ставит признак', () => {
  setSignedIn({ login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false })

  assert.equal(document.documentElement.dataset.signedIn, 'yes')
})

test('выход снимает его — иначе экран остаётся пустым', () => {
  setSignedIn({ login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false })
  setSignedOut(null)

  assert.equal(document.documentElement.dataset.signedIn, undefined)
})

test('истёкшая сессия — тот же случай, что выход', () => {
  setSignedIn({ login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false })
  setSignedOut('Session expired')

  assert.equal(document.documentElement.dataset.signedIn, undefined)
})

test('выход забывает и имя командира — следующим может сесть другой', () => {
  setSignedIn({ login: 'cmdr', email: 'c@example.com', isTestUser: false, isAdmin: false })
  rememberCommander('Jameson')
  setSignedOut(null)

  assert.equal(getLastCommanderSnapshot(), null)
})
