'use client'

import { useId, useState } from 'react'
import type { UseSessionResult } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { Recaptcha } from '@/shared/ui/Recaptcha'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

export type SignInFormProps = {
  session: UseSessionResult
  onRegister?: () => void
  onNeedConfirm?: (login: string, password: string, remember: boolean) => void
}

export function SignInForm({ session, onRegister, onNeedConfirm }: SignInFormProps) {
  const t = useTranslation()
  const loginId = useId()
  const passwordId = useId()
  const rememberId = useId()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [localError, setLocalError] = useState<string | null>(null)

  const captchaRequired = session.loginCaptchaRequired

  const submit = async () => {
    setLocalError(null)

    if (captchaRequired && captcha === null) {
      setLocalError(t('captcha.required'))
      return
    }

    const outcome = await session.signIn(login, password, remember, captcha ?? undefined)

    if (outcome.ok) {
      return
    }

    setCaptcha(null)
    setResetSignal((value) => value + 1)

    if (outcome.obstacle === 'emailNotConfirmed') {
      onNeedConfirm?.(login, password, remember)
    }
  }

  return (
    <section aria-labelledby="signin-heading" className="max-w-sm">
      <h3 id="signin-heading" className="text-base font-semibold">
        {t('signIn.heading')}
      </h3>

      <form
        className="mt-2 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={loginId} className="text-sm font-medium">
            {t('signIn.login')}
          </label>
          <input
            id={loginId}
            type="text"
            autoComplete="username"
            required
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={passwordId} className="text-sm font-medium">
            {t('signIn.password')}
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={rememberId} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              id={rememberId}
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              aria-describedby={`${rememberId}-hint`}
              className="size-4"
            />
            {t('signIn.remember')}
          </label>
          <p id={`${rememberId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
            {t('signIn.rememberHint')}
          </p>
        </div>

        {captchaRequired ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-warm-700 dark:text-warm-300">{t('signIn.captchaHint')}</p>
            <Recaptcha onToken={setCaptcha} resetSignal={resetSignal} />
          </div>
        ) : null}

        <Button type="submit" disabled={session.isBusy} className="self-start">
          {session.isBusy ? t('signIn.submitting') : t('signIn.submit')}
        </Button>

        {(localError ?? session.errorMessage) ? (
          <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
            {localError ?? session.errorMessage}
          </p>
        ) : null}
      </form>

      {session.passwordResetEnabled ? (
        <p className="text-sm">
          <a href="../reset/" className="text-aubergine-700 underline dark:text-orange-400">
            {t('reset.link')}
          </a>
        </p>
      ) : null}

      {session.registrationEnabled ? (
        <div className="mt-3 flex flex-col items-start gap-2">
          <Button type="button" variant="secondary" onClick={() => onRegister?.()}>
            {t('signIn.toRegister')}
          </Button>
          <button
            type="button"
            onClick={() => onNeedConfirm?.(login, password, remember)}
            className="text-sm text-aubergine-700 underline dark:text-orange-400"
          >
            {t('signIn.toConfirm')}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-warm-700 dark:text-warm-300">
          {t('signIn.registrationClosed')}
        </p>
      )}
    </section>
  )
}
