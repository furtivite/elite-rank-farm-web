import assert from 'node:assert/strict'
import { test } from 'node:test'
import '@/shared/test/renderInDom'
import { LAST_COMMANDER_STORAGE_KEY } from '@/shared/config/storageKeys'
import { getLastCommanderSnapshot, rememberCommander } from '@/shared/lib/lastCommander'

Object.defineProperty(globalThis, 'localStorage', {
  value: window.localStorage,
  configurable: true,
})

test('имя уходит в браузер — следующая загрузка страницы его прочитает', () => {
  rememberCommander('Jameson')

  assert.equal(getLastCommanderSnapshot(), 'Jameson')
  assert.equal(localStorage.getItem(LAST_COMMANDER_STORAGE_KEY), 'Jameson')
})

test('забытое имя стирается и из браузера', () => {
  rememberCommander('Jameson')
  rememberCommander(null)

  assert.equal(getLastCommanderSnapshot(), null)
  assert.equal(localStorage.getItem(LAST_COMMANDER_STORAGE_KEY), null)
})

test('пустое имя — то же, что никакого', () => {
  rememberCommander('Jameson')
  rememberCommander('')

  assert.equal(getLastCommanderSnapshot(), null)
})
