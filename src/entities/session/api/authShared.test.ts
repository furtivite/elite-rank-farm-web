import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readMessage } from '@/entities/session/api/authShared'
import { writeLanguage } from '@/shared/lib/i18n'

function answer(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('известный код переводится, а не показывается фразой сервера', async () => {
  writeLanguage('ru')

  const message = await readMessage(
    answer({
      status: 'error',
      message: 'Invalid login or password.',
      code: 'auth.invalidCredentials',
    }),
    'fallback',
  )

  assert.equal(message, 'Неверный логин или пароль.')
})

test('подстановки берутся из errors', async () => {
  writeLanguage('ru')

  const message = await readMessage(
    answer({
      status: 'error',
      message: 'Password was changed recently. Try again in 4 min.',
      code: 'account.passwordCooldown',
      errors: { minutes: '4' },
    }),
    'fallback',
  )

  assert.match(message, /4 мин/)
  assert.doesNotMatch(message, /\{minutes\}/)
})

test('незнакомый код не ломает ответ: остаётся фраза сервера', async () => {
  writeLanguage('ru')

  const message = await readMessage(
    answer({ status: 'error', message: 'Something new.', code: 'auth.somethingNew' }),
    'fallback',
  )

  assert.equal(message, 'Something new.')
})

test('без кода всё как раньше', async () => {
  const message = await readMessage(answer({ status: 'error', message: 'Plain.' }), 'fallback')

  assert.equal(message, 'Plain.')
})
