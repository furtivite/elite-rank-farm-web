'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { login as loginRequest, logout as logoutRequest } from '@/entities/session/api/authApi'
import type { SignInObstacle } from '@/entities/session/api/authApi'
import {
  ensureLoaded,
  getServerSessionSnapshot,
  getSessionSnapshot,
  setBusy,
  setError,
  setLoginCaptchaRequired,
  setSignedIn,
  setSignedOut,
  subscribeToSession,
} from '@/entities/session/model/sessionStore'
import type { SessionStatus, SessionUser } from '@/entities/session/model/types'

export type UseSessionResult = {
  status: SessionStatus
  user: SessionUser | null
  cachedLogin: string | null
  registrationEnabled: boolean
  passwordResetEnabled: boolean
  loginCaptchaRequired: boolean
  errorMessage: string | null
  isBusy: boolean
  signIn: (
    login: string,
    password: string,
    remember?: boolean,
    captcha?: string,
  ) => Promise<SignInOutcome>
  signOut: () => Promise<void>
}

export type SignInOutcome =
  { ok: true } | { ok: false; obstacle: SignInObstacle | null; message: string }

export function useSession(): UseSessionResult {
  const state = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  )

  useEffect(() => {
    void ensureLoaded()
  }, [])

  const signIn = useCallback(
    async (
      login: string,
      password: string,
      remember = false,
      captcha?: string,
    ): Promise<SignInOutcome> => {
      setBusy(true)
      const result = await loginRequest(login, password, remember, captcha)
      setBusy(false)

      if (!result.ok) {
        const obstacle = 'obstacle' in result ? result.obstacle : null

        if (obstacle === 'emailNotConfirmed') {
          setError(result.message)
          return { ok: false, obstacle, message: result.message }
        }

        if (obstacle === 'captchaRequired') {
          setLoginCaptchaRequired(true)
        }

        setSignedOut(result.message)
        return { ok: false, obstacle, message: result.message }
      }

      setSignedIn(result.user)
      return { ok: true }
    },
    [],
  )

  const signOut = useCallback(async () => {
    setBusy(true)
    const result = await logoutRequest()
    setBusy(false)

    setSignedOut(result.ok ? null : result.message)
  }, [])

  return {
    status: state.status,
    user: state.user,
    cachedLogin: state.cachedLogin,
    registrationEnabled: state.registrationEnabled,
    passwordResetEnabled: state.passwordResetEnabled,
    loginCaptchaRequired: state.loginCaptchaRequired,
    errorMessage: state.errorMessage,
    isBusy: state.isBusy,
    signIn,
    signOut,
  }
}

export function useIsAdmin(): boolean {
  const state = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  )

  return state.user?.isAdmin === true
}
