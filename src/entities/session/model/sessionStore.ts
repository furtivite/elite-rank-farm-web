import { SESSION_CACHE_STORAGE_KEY } from '@/shared/config/storageKeys'
import { rememberCommander } from '@/shared/lib/lastCommander'
import { fetchMe } from '@/entities/session/api/authApi'
import type { SessionStatus, SessionUser } from '@/entities/session/model/types'

export type SessionState = {
  status: SessionStatus
  user: SessionUser | null
  registrationEnabled: boolean
  passwordResetEnabled: boolean
  loginCaptchaRequired: boolean
  errorMessage: string | null
  isBusy: boolean
  cachedLogin: string | null
}

const EMPTY: SessionState = {
  status: 'unknown',
  user: null,
  registrationEnabled: false,
  passwordResetEnabled: false,
  loginCaptchaRequired: false,
  errorMessage: null,
  isBusy: false,
  cachedLogin: null,
}

let snapshot: SessionState = EMPTY
let initialized = false
let inFlight: Promise<void> | null = null

let lastAttemptFailed = false
let failureCount = 0
let nextAttemptAt = 0

const listeners = new Set<() => void>()

function readCachedLogin(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(SESSION_CACHE_STORAGE_KEY)
    return raw === null || raw === '' ? null : raw
  } catch {
    return null
  }
}

function writeCachedLogin(login: string | null): void {
  if (typeof document !== 'undefined') {
    if (login === null) {
      delete document.documentElement.dataset.signedIn
    } else {
      document.documentElement.dataset.signedIn = 'yes'
    }
  }

  try {
    if (login === null) {
      localStorage.removeItem(SESSION_CACHE_STORAGE_KEY)
    } else {
      localStorage.setItem(SESSION_CACHE_STORAGE_KEY, login)
    }
  } catch {}
}

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

function setState(next: Partial<SessionState>): void {
  snapshot = { ...snapshot, ...next }
  emit()
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = { ...snapshot, cachedLogin: readCachedLogin() }
}

export function getSessionSnapshot(): SessionState {
  ensureInitialized()
  return snapshot
}

export function getServerSessionSnapshot(): SessionState {
  return EMPTY
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function ensureLoaded(): Promise<void> {
  ensureInitialized()

  if (snapshot.status !== 'unknown' && !lastAttemptFailed) {
    return Promise.resolve()
  }

  if (lastAttemptFailed && Date.now() < nextAttemptAt) {
    return Promise.resolve()
  }

  inFlight ??= refreshSession()
  return inFlight
}

export async function refreshSession(): Promise<void> {
  const result = await fetchMe()

  if (!result.ok) {
    lastAttemptFailed = true
    failureCount += 1
    nextAttemptAt = Date.now() + Math.min(2 ** failureCount, 60) * 1000

    setState({ status: 'guest', user: null, errorMessage: result.message })
    inFlight = null
    return
  }

  lastAttemptFailed = false
  failureCount = 0
  nextAttemptAt = 0

  setState({
    status: result.user === null ? 'guest' : 'user',
    user: result.user,
    registrationEnabled: result.registrationEnabled,
    passwordResetEnabled: result.passwordResetEnabled,
    loginCaptchaRequired: result.loginCaptchaRequired,
    errorMessage: null,
    cachedLogin: result.user?.login ?? null,
  })
  writeCachedLogin(result.user?.login ?? null)
  if (result.user === null) {
    rememberCommander(null)
  }
  inFlight = null
}

export function setBusy(isBusy: boolean): void {
  setState({ isBusy })
}

export function setSignedIn(user: SessionUser): void {
  setState({ status: 'user', user, errorMessage: null, cachedLogin: user.login })
  writeCachedLogin(user.login)
}

export function setSignedOut(errorMessage: string | null): void {
  setState({ status: 'guest', user: null, errorMessage, cachedLogin: null })
  writeCachedLogin(null)
  rememberCommander(null)
}

export function setError(errorMessage: string): void {
  setState({ errorMessage })
}

export function setLoginCaptchaRequired(required: boolean): void {
  setState({ loginCaptchaRequired: required })
}

export function _resetSessionStoreForTests(): void {
  snapshot = EMPTY
  initialized = true
  inFlight = null
  lastAttemptFailed = false
  failureCount = 0
  nextAttemptAt = 0
}
