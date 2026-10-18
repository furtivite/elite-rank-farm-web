import { AUTH_URL, failure, readMessage, type AuthResult } from '@/entities/session/api/authShared'
import { currentTranslate } from '@/shared/lib/i18n'

export async function requestPasswordReset(
  email: string,
  captcha: string,
): Promise<AuthResult<{ message: string }>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.passwordReset, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, captcha }),
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

  return { ok: true, message: t('reset.sentIfKnown') }
}

export async function completePasswordReset(
  token: string,
  password: string,
): Promise<AuthResult<{ message: string }>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.passwordResetComplete, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (response.status === 429) {
    return failure(await readMessage(response, t('error.tooManyAttempts')))
  }
  if (!response.ok) {
    return failure(await readMessage(response, t('reset.linkDead')))
  }

  return { ok: true, message: t('reset.done') }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<AuthResult<unknown>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.password, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (response.status === 401) {
    return failure(t('error.currentPasswordWrong'))
  }
  if (response.status === 429) {
    return failure(await readMessage(response, t('error.passwordChangedRecently')))
  }
  if (!response.ok) {
    return failure(
      await readMessage(response, t('error.serverReturned', { status: response.status })),
    )
  }

  return { ok: true }
}
