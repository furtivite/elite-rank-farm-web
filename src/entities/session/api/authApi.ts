import {
  AUTH_URL,
  failure,
  readMessage,
  type AuthFailure,
  type AuthResult,
} from '@/entities/session/api/authShared'

export type { AuthFailure, AuthResult } from '@/entities/session/api/authShared'
export {
  completePasswordReset,
  changePassword,
  requestPasswordReset,
} from '@/entities/session/api/passwordApi'
export {
  confirmEmail,
  resendConfirmationCode,
  resubscribeEmails,
  unsubscribeEmails,
} from '@/entities/session/api/emailApi'

import { currentTranslate } from '@/shared/lib/i18n'
import type { SessionUser } from '@/entities/session/model/types'

export type MeResponse = {
  user: SessionUser | null
  registrationEnabled: boolean
  passwordResetEnabled: boolean
  loginCaptchaRequired: boolean
}

export type SignInObstacle = 'emailNotConfirmed' | 'captchaRequired'

export async function fetchMe(): Promise<AuthResult<MeResponse>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.me, { credentials: 'include', cache: 'no-store' })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (!response.ok) {
    return failure(
      await readMessage(response, t('error.serverReturned', { status: response.status })),
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return failure(t('error.badResponse'))
  }

  if (typeof payload !== 'object' || payload === null) {
    return failure(t('error.badResponse'))
  }

  const { user, registrationEnabled, passwordResetEnabled, loginCaptchaRequired } = payload as {
    user?: unknown
    registrationEnabled?: unknown
    passwordResetEnabled?: unknown
    loginCaptchaRequired?: unknown
  }

  const fields = typeof user === 'object' && user !== null ? (user as Record<string, unknown>) : {}
  const isUser = typeof fields.login === 'string' && typeof fields.email === 'string'

  return {
    ok: true,
    user: isUser
      ? {
          login: fields.login as string,
          email: fields.email as string,
          isTestUser: fields.isTestUser === true,
          isAdmin: fields.isAdmin === true,
        }
      : null,
    registrationEnabled: registrationEnabled === true,
    passwordResetEnabled: passwordResetEnabled === true,
    loginCaptchaRequired: loginCaptchaRequired === true,
  }
}

async function readObstacle(response: Response): Promise<SignInObstacle | null> {
  try {
    const body: unknown = await response.clone().json()
    const errors = (body as { errors?: unknown }).errors

    if (typeof errors !== 'object' || errors === null) {
      return null
    }

    const fields = errors as Record<string, unknown>
    if (fields.reason === 'emailNotConfirmed') {
      return 'emailNotConfirmed'
    }
    if (fields.captchaRequired === 'true') {
      return 'captchaRequired'
    }
  } catch {}

  return null
}

export async function login(
  userLogin: string,
  password: string,
  remember = false,
  captcha?: string,
): Promise<AuthResult<{ user: SessionUser }> | (AuthFailure & { obstacle: SignInObstacle })> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.login, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        captcha === undefined
          ? { login: userLogin, password, remember }
          : { login: userLogin, password, remember, captcha },
      ),
    })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (response.status === 403 || response.status === 400 || response.status === 401) {
    const obstacle = await readObstacle(response)
    const message =
      response.status === 401 && obstacle === null
        ? t('error.invalidCredentials')
        : await readMessage(response, t('error.invalidCredentials'))

    return obstacle === null ? failure(message) : { ...failure(message), obstacle }
  }

  if (response.status === 429) {
    return failure(t('error.tooManyAttempts'))
  }
  if (response.status === 503) {
    return failure(await readMessage(response, t('error.captchaUnavailable')))
  }
  if (!response.ok) {
    return failure(
      await readMessage(response, t('error.serverReturned', { status: response.status })),
    )
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

export async function register(
  userLogin: string,
  email: string,
  password: string,
  captcha: string,
): Promise<AuthResult<{ message: string }>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.register, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: userLogin, email, password, captcha }),
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

export async function logout(): Promise<AuthResult<unknown>> {
  const t = currentTranslate()
  try {
    const response = await fetch(AUTH_URL.logout, { method: 'POST', credentials: 'include' })
    return response.ok
      ? { ok: true }
      : failure(await readMessage(response, t('error.signOutFailed')))
  } catch {
    return failure(t('error.serverUnreachable'))
  }
}

export async function signOutOtherSessions(): Promise<AuthResult<unknown>> {
  const t = currentTranslate()
  try {
    const response = await fetch(AUTH_URL.signOutOthers, {
      method: 'POST',
      credentials: 'include',
    })
    return response.ok
      ? { ok: true }
      : failure(await readMessage(response, t('error.endSessionsFailed')))
  } catch {
    return failure(t('error.serverUnreachable'))
  }
}

export async function signOutTestUsers(): Promise<AuthResult<unknown>> {
  const t = currentTranslate()
  try {
    const response = await fetch(AUTH_URL.signOutTestUsers, {
      method: 'POST',
      credentials: 'include',
    })
    return response.ok
      ? { ok: true }
      : failure(await readMessage(response, t('error.endSessionsFailed')))
  } catch {
    return failure(t('error.serverUnreachable'))
  }
}

export async function issueDeviceToken(): Promise<AuthResult<{ deviceToken: string }>> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(AUTH_URL.deviceToken, { method: 'POST', credentials: 'include' })
  } catch {
    return failure(t('error.serverUnreachable'))
  }

  if (!response.ok) {
    return failure(
      await readMessage(response, t('error.serverReturned', { status: response.status })),
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return failure(t('error.badResponse'))
  }

  const token = (payload as { deviceToken?: unknown })?.deviceToken
  if (typeof token !== 'string' || token === '') {
    return failure(t('error.noKeyReturned'))
  }

  return { ok: true, deviceToken: token }
}
