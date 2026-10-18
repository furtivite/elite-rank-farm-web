import { currentTranslate, type TranslationKey } from '@/shared/lib/i18n'
import { withBasePath } from '@/shared/config/basePath'

export const AUTH_URL = {
  me: withBasePath('/api/auth/me'),
  login: withBasePath('/api/auth/login'),
  logout: withBasePath('/api/auth/logout'),
  register: withBasePath('/api/auth/register'),
  emailConfirm: withBasePath('/api/auth/email-confirm'),
  emailConfirmResend: withBasePath('/api/auth/email-confirm-resend'),
  unsubscribe: withBasePath('/api/auth/unsubscribe'),
  resubscribe: withBasePath('/api/auth/resubscribe'),
  deviceToken: withBasePath('/api/account/device-token'),
  signOutOthers: withBasePath('/api/account/sign-out-others'),
  signOutTestUsers: withBasePath('/api/account/sign-out-test-users'),
  password: withBasePath('/api/account/password'),
  passwordReset: withBasePath('/api/auth/password-reset'),
  passwordResetComplete: withBasePath('/api/auth/password-reset-complete'),
} as const

export type AuthFailure = { ok: false; message: string }
export type AuthResult<T> = ({ ok: true } & (T extends object ? T : unknown)) | AuthFailure

export function failure(message: string): AuthFailure {
  return { ok: false, message }
}

export async function readMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null) {
      return fallback
    }

    const { code, message, errors } = body as {
      code?: unknown
      message?: unknown
      errors?: unknown
    }

    if (typeof code === 'string') {
      const translated = translateApiError(code, errors)
      if (translated !== null) {
        return translated
      }
    }

    if (typeof message === 'string') {
      return message
    }
  } catch {}

  return fallback
}

function translateApiError(code: string, errors: unknown): string | null {
  const t = currentTranslate()
  const key = `apiError.${code}` as TranslationKey
  const values =
    typeof errors === 'object' && errors !== null ? (errors as Record<string, string>) : {}

  const template = t(key) as string | undefined
  if (template === undefined) {
    return null
  }

  return t(key, values)
}
