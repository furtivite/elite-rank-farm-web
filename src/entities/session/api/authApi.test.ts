import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  confirmEmail,
  fetchMe,
  issueDeviceToken,
  login,
  register,
  resendConfirmationCode,
} from '@/entities/session/api/authApi'

type FetchStub = (input: unknown, init?: unknown) => Promise<Response>

const realFetch = globalThis.fetch

function stubFetch(stub: FetchStub): void {
  globalThis.fetch = stub as typeof globalThis.fetch
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  globalThis.fetch = realFetch
})

test('fetchMe разбирает гостя и пользователя', async () => {
  stubFetch(async () => jsonResponse(200, { status: 'ok', user: null, registrationEnabled: false }))
  const guest = await fetchMe()
  assert.equal(guest.ok, true)
  assert.equal(guest.ok && guest.user, null)

  stubFetch(async () =>
    jsonResponse(200, {
      status: 'ok',
      user: { login: 'egor', email: 'a@b.c' },
      registrationEnabled: true,
    }),
  )
  const user = await fetchMe()
  assert.equal(user.ok && user.user?.login, 'egor')
  assert.equal(user.ok && user.user?.email, 'a@b.c')
  assert.equal(user.ok && user.registrationEnabled, true)
})

test('признак тестовой записи читается, но по умолчанию false (60)', async () => {
  stubFetch(async () =>
    jsonResponse(200, {
      status: 'ok',
      user: { login: 'test', email: '···@···.com', isTestUser: true },
    }),
  )
  const testAccount = await fetchMe()
  assert.equal(testAccount.ok && testAccount.user?.isTestUser, true)

  stubFetch(async () => jsonResponse(200, { status: 'ok', user: { login: 'a', email: 'a@b.c' } }))
  const legacy = await fetchMe()
  assert.equal(legacy.ok && legacy.user?.isTestUser, false)
})

test('fetchMe не выдаёт мусор за пользователя', async () => {
  stubFetch(async () => jsonResponse(200, { status: 'ok', user: 'кто-то' }))
  const garbage = await fetchMe()
  assert.equal(garbage.ok, true)
  assert.equal(garbage.ok && garbage.user, null)

  stubFetch(async () => jsonResponse(200, { status: 'ok', user: { login: 'egor' } }))
  const halfway = await fetchMe()
  assert.equal(halfway.ok && halfway.user, null)
})

test('недоступный сервер — это сообщение, а не исключение', async () => {
  stubFetch(async () => {
    throw new TypeError('network error')
  })

  const result = await fetchMe()
  assert.equal(result.ok, false)
  assert.equal(result.ok === false && result.message, 'The server is unreachable.')
})

test('вход отвечает понятным текстом на 401 и 429', async () => {
  stubFetch(async () => jsonResponse(401, { message: 'Invalid login or password.' }))
  const wrong = await login('egor', 'nope')
  assert.equal(wrong.ok === false && wrong.message, 'Wrong login or password.')

  stubFetch(async () => jsonResponse(429, { message: 'Too many attempts.' }))
  const limited = await login('egor', 'nope')
  assert.equal(limited.ok === false && limited.message, 'Too many attempts. Wait a few minutes.')
})

test('вход отправляет логин, а не почту (54)', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(200, { status: 'ok', user: { login: 'egor', email: 'a@b.c' } })
  })

  await login('egor', 'secret')

  const [init] = seen
  assert.ok(init)
  assert.equal(init.credentials, 'include')
  assert.equal(init.method, 'POST')
  assert.deepEqual(JSON.parse(String(init.body)), {
    login: 'egor',
    password: 'secret',
    remember: false,
  })
})

test('«запомнить меня» едет тем же запросом, а не отдельным (83.2)', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(200, { status: 'ok', user: { login: 'egor', email: 'a@b.c' } })
  })

  await login('egor', 'secret', true)

  assert.equal(seen.length, 1, 'второго запроса быть не должно')
  assert.equal(JSON.parse(String(seen[0].body)).remember, true)
})

test('ключ агента принимается только строкой', async () => {
  stubFetch(async () => jsonResponse(201, { status: 'ok', deviceToken: 'abc' }))
  const ok = await issueDeviceToken()
  assert.equal(ok.ok && ok.deviceToken, 'abc')

  stubFetch(async () => jsonResponse(201, { status: 'ok' }))
  const missing = await issueDeviceToken()
  assert.equal(missing.ok === false && missing.message, 'The server did not return a key.')
})

test('неподтверждённая почта — это не ошибка входа, а следующий шаг (99.6)', async () => {
  stubFetch(async () =>
    jsonResponse(403, {
      status: 'error',
      message: 'Confirm your email address to finish signing in. We have just sent you a code.',
      errors: { reason: 'emailNotConfirmed' },
    }),
  )

  const result = await login('jameson', 'right-password')

  assert.equal(result.ok, false)
  assert.equal(result.ok === false && 'obstacle' in result && result.obstacle, 'emailNotConfirmed')
  assert.match(result.ok === false ? result.message : '', /sent you a code/)
})

test('после трёх неудач вход просит капчу, и форма узнаёт об этом сразу', async () => {
  stubFetch(async () =>
    jsonResponse(401, {
      status: 'error',
      message: 'Invalid login or password.',
      errors: { captchaRequired: 'true' },
    }),
  )

  const result = await login('egor', 'nope')

  assert.equal(result.ok === false && 'obstacle' in result && result.obstacle, 'captchaRequired')
})

test('обычная неудача входа остаётся прежней: ни причины, ни капчи', async () => {
  stubFetch(async () => jsonResponse(401, { message: 'Invalid login or password.' }))

  const plain = await login('egor', 'nope')

  assert.equal(plain.ok === false && plain.message, 'Wrong login or password.')
  assert.equal('obstacle' in plain, false, 'причины нет — и поля быть не должно')
})

test('капча с токеном едет тем же запросом входа', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(200, { status: 'ok', user: { login: 'egor', email: 'a@b.c' } })
  })

  await login('egor', 'secret', false, 'captcha-token')

  assert.deepEqual(JSON.parse(String(seen[0]?.body)), {
    login: 'egor',
    password: 'secret',
    remember: false,
    captcha: 'captcha-token',
  })
})

test('без капчи поля в запросе нет вовсе, а не пустая строка', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(200, { status: 'ok', user: { login: 'egor', email: 'a@b.c' } })
  })

  await login('egor', 'secret')

  assert.equal('captcha' in JSON.parse(String(seen[0]?.body)), false)
})

test('регистрация не входит, а отправляет код', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(201, {
      status: 'ok',
      emailConfirmationRequired: true,
      message: 'Check your email for the confirmation code.',
    })
  })

  const result = await register('newcmdr', 'new@example.com', 'twelve-chars-long', 'token')

  assert.equal(result.ok, true)
  assert.match(result.ok ? result.message : '', /confirmation code/)
  assert.deepEqual(JSON.parse(String(seen[0]?.body)), {
    login: 'newcmdr',
    email: 'new@example.com',
    password: 'twelve-chars-long',
    captcha: 'token',
  })
})

test('503 — это «капча недоступна», а не «вы робот» (99.6)', async () => {
  stubFetch(async () => jsonResponse(503, { message: 'The captcha service is unavailable.' }))

  const registration = await register('newcmdr', 'new@example.com', 'twelve-chars-long', 'token')
  assert.match(registration.ok === false ? registration.message : '', /unavailable/i)

  stubFetch(async () => jsonResponse(503, {}))
  const resend = await resendConfirmationCode('jameson', 'right-password', 'token')
  assert.match(
    resend.ok === false ? resend.message : '',
    /not about you/i,
    'умолчание из словаря объясняет, что дело не в человеке',
  )
})

test('подтверждение кодом открывает сессию и отдаёт пользователя', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(200, {
      status: 'ok',
      user: { login: 'jameson', email: 'a@b.c', isTestUser: false, isAdmin: true },
    })
  })

  const result = await confirmEmail('jameson', 'right-password', 'ab-cdef')

  assert.equal(result.ok && result.user.login, 'jameson')
  assert.equal(result.ok && result.user.isAdmin, true, 'признак админа приходит уже с этим ответом')
  assert.deepEqual(JSON.parse(String(seen[0]?.body)), {
    login: 'jameson',
    password: 'right-password',
    code: 'ab-cdef',
    remember: false,
  })
})

test('галочка со входа доезжает до подтверждения почты (83.9)', async () => {
  const seen: Array<Record<string, unknown>> = []
  stubFetch(async (_url, init) => {
    seen.push(init as Record<string, unknown>)
    return jsonResponse(200, { status: 'ok', user: { login: 'jameson', email: 'a@b.c' } })
  })

  await confirmEmail('jameson', 'right-password', 'ab-cdef', true)

  assert.equal(
    JSON.parse(String(seen[0]?.body)).remember,
    true,
    'здесь открывается первая сессия записи — без флага продлённый вход терялся',
  )
})

test('негодный код объясняется отдельно от прочих ошибок', async () => {
  stubFetch(async () => jsonResponse(400, {}))

  const result = await confirmEmail('jameson', 'right-password', 'ZZZZZZ')

  assert.match(result.ok === false ? result.message : '', /no longer works/i)
})
