import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SIGNED_IN_BOOT_SCRIPT } from '@/shared/lib/session'
import { SESSION_CACHE_STORAGE_KEY } from '@/shared/config/storageKeys'

test('скрипт читает тот же ключ, что и приложение', () => {
  assert.match(SIGNED_IN_BOOT_SCRIPT, new RegExp(SESSION_CACHE_STORAGE_KEY))
})

test('недоступное хранилище не роняет страницу', () => {
  assert.match(SIGNED_IN_BOOT_SCRIPT, /try\s*\{/)
  assert.match(SIGNED_IN_BOOT_SCRIPT, /catch/)
})

test('скрипт работает и без localStorage вовсе', () => {
  const html = { dataset: {} as Record<string, string> }
  // oxlint-disable-next-line typescript/no-implied-eval
  const run = new Function('document', 'localStorage', SIGNED_IN_BOOT_SCRIPT)

  run(
    { documentElement: html },
    {
      getItem() {
        throw new Error('storage disabled')
      },
    },
  )

  assert.equal(html.dataset.signedIn, undefined)
})

test('с логином в хранилище признак ставится', () => {
  const html = { dataset: {} as Record<string, string> }
  // oxlint-disable-next-line typescript/no-implied-eval
  const run = new Function('document', 'localStorage', SIGNED_IN_BOOT_SCRIPT)

  run({ documentElement: html }, { getItem: () => 'jameson' })

  assert.equal(html.dataset.signedIn, 'yes')
})
