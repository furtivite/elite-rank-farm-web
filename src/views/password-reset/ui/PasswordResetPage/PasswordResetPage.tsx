'use client'

import { useEffect, useId, useState } from 'react'
import { useCommanderState } from '@/entities/commander-state'
import { completePasswordReset, requestPasswordReset, useSession } from '@/entities/session'
import { PASSWORD_MIN_LENGTH } from '@/shared/config/accountRules'
import { AppShell } from '@/widgets/app-shell'
import { Button } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'
import { Recaptcha } from '@/shared/ui/Recaptcha'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

export function PasswordResetPage() {
  const t = useTranslation()
  const session = useSession()
  const commander = useCommanderState(
    session.status === 'user',
    session.user?.isTestUser === true,
    session.status === 'guest',
  )
  const emailId = useId()
  const passwordId = useId()
  const repeatId = useId()

  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [status, setStatus] = useState<'reading' | 'asking' | 'ready' | 'sending' | 'done'>(
    'reading',
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const found = new URLSearchParams(window.location.search).get('token')
    setToken(found)
    setStatus(found === null || found === '' ? 'asking' : 'ready')
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const askForEmail = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (captcha === null) {
      setError(t('captcha.required'))
      return
    }

    setStatus('sending')
    const result = await requestPasswordReset(email, captcha)

    setCaptcha(null)
    setResetSignal((value) => value + 1)

    if (!result.ok) {
      setStatus('asking')
      setError(result.message)
      return
    }

    setStatus('done')
    setMessage(result.message)
  }

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (token === null) {
      return
    }

    setError(null)

    if (password !== repeat) {
      setError(t('password.mismatch'))
      return
    }

    setStatus('sending')
    const result = await completePasswordReset(token, password)

    if (result.ok) {
      setStatus('done')
      setMessage(result.message)
      setPassword('')
      setRepeat('')
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    setStatus('ready')
    setError(result.message)
  }

  const isSending = status === 'sending'

  return (
    <AppShell activeNav="account" session={session} commander={commander} withSettings={false}>
      <section aria-labelledby="reset-heading" className="flex max-w-md flex-col gap-3">
        <h2 id="reset-heading" className="text-xl font-semibold">
          {t('reset.heading')}
        </h2>

        {error === null ? null : (
          <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
            {error}
          </p>
        )}

        {message === null ? null : (
          <p role="status" className="text-sm text-warm-900 dark:text-warm-100">
            {message}
          </p>
        )}

        {status === 'asking' || (isSending && token === null) ? (
          <form className="flex flex-col gap-3" onSubmit={askForEmail}>
            <p className="text-sm text-warm-700 dark:text-warm-300">{t('reset.explanation')}</p>

            <label className="flex flex-col gap-1" htmlFor={emailId}>
              <span className="text-sm font-medium">{t('reset.email')}</span>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                required
              />
            </label>

            <Recaptcha onToken={setCaptcha} resetSignal={resetSignal} />

            <Button type="submit" disabled={isSending} className="self-start">
              {isSending ? t('reset.sending') : t('reset.send')}
            </Button>
          </form>
        ) : null}

        {status === 'ready' || (isSending && token !== null) ? (
          <form className="flex flex-col gap-3" onSubmit={submitPassword}>
            <label className="flex flex-col gap-1" htmlFor={passwordId}>
              <span className="text-sm font-medium">{t('reset.newPassword')}</span>
              <input
                id={passwordId}
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={`${passwordId}-hint`}
                className={inputClassName}
                required
              />
              <span id={`${passwordId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
                {t('password.minLength', { min: PASSWORD_MIN_LENGTH })}
              </span>
            </label>

            <label className="flex flex-col gap-1" htmlFor={repeatId}>
              <span className="text-sm font-medium">{t('password.repeat')}</span>
              <input
                id={repeatId}
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                className={inputClassName}
                required
              />
            </label>

            <Button type="submit" disabled={isSending}>
              {isSending ? t('reset.applying') : t('reset.apply')}
            </Button>
          </form>
        ) : null}

        <a href="../account/" className="text-sm text-aubergine-700 underline dark:text-orange-400">
          {t('reset.cancel')}
        </a>
      </section>
    </AppShell>
  )
}
