import { AUTH_URL, failure, readMessage, type AuthResult } from '@/entities/session/api/authShared'
import { currentTranslate } from '@/shared/lib/i18n'
import type { SessionUser } from '@/entities/session/model/types'

export async function confirmEmail(
  userLogin: string,
  password: string,
  code: string,
  remember = false,
): Promise<AuthResult<{ user: SessionUser }>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.emailConfirm, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: userLogin, password, code, remember }),
    })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (response.status === 429) {
    return failure(await readMessage(response, t('error.tooManyAttempts')))
  }
  if (!response.ok) {
    return failure(await readMessage(response, t('confirm.codeDead')))
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return failure(t('error.badResponse'))
  }

  const user = (payload as { user?: unknown })?.user
  const fields = typeof user === 'object' && user !== null ? (user as Record<string, unknown>) : {}

  return {
    ok: true,
    user: {
      login: typeof fields.login === 'string' ? fields.login : userLogin,
      email: typeof fields.email === 'string' ? fields.email : '',
      isTestUser: fields.isTestUser === true,
      isAdmin: fields.isAdmin === true,
    },
  }
}

export async function resendConfirmationCode(
  userLogin: string,
  password: string,
  captcha: string,
): Promise<AuthResult<{ message: string }>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.emailConfirmResend, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: userLogin, password, captcha }),
    })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (response.status === 429) {
    return failure(await readMessage(response, t('error.tooManyAttempts')))
  }
  if (response.status === 503) {
    return failure(await readMessage(response, t('error.captchaUnavailable')))
  }
  if (!response.ok) {
    return failure(
      await readMessage(response, t('error.serverReturned', { status: response.status })),
    )
  }

  return { ok: true, message: await readMessage(response, t('confirm.sent')) }
}

export async function unsubscribeEmails(
  user: number,
  signature: string,
): Promise<AuthResult<unknown>> {
  return postSubscription(AUTH_URL.unsubscribe, user, signature)
}

export async function resubscribeEmails(
  user: number,
  signature: string,
): Promise<AuthResult<unknown>> {
  return postSubscription(AUTH_URL.resubscribe, user, signature)
}

async function postSubscription(
  url: string,
  user: number,
  signature: string,
): Promise<AuthResult<unknown>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, signature }),
    })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (response.status === 429) {
    return failure(await readMessage(response, t('error.tooManyAttempts')))
  }
  if (!response.ok) {
    return failure(
      await readMessage(response, t('error.serverReturned', { status: response.status })),
    )
  }

  return { ok: true }
}
