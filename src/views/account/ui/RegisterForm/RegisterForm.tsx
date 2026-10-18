'use client'

import { useId, useState } from 'react'
import { register } from '@/entities/session'
import {
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/shared/config/accountRules'
import { withBasePath } from '@/shared/config/basePath'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { Recaptcha } from '@/shared/ui/Recaptcha'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

export type RegisterFormProps = {
  onRegistered: (login: string, password: string) => void
  onCancel: () => void
}

export function RegisterForm({ onRegistered, onCancel }: RegisterFormProps) {
  const t = useTranslation()
  const loginId = useId()
  const emailId = useId()
  const passwordId = useId()
  const repeatId = useId()

  const [login, setLogin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)

  const submit = async () => {
    setError(null)

    if (password !== repeat) {
      setError(t('password.mismatch'))
      return
    }

    if (captcha === null) {
      setError(t('captcha.required'))
      return
    }

    setIsBusy(true)
    const result = await register(login, email, password, captcha)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.message)
      setCaptcha(null)
      setResetSignal((value) => value + 1)
      return
    }

    onRegistered(login, password)
  }

  return (
    <section aria-labelledby="register-heading" className="max-w-sm">
      <h3 id="register-heading" className="text-base font-semibold">
        {t('register.heading')}
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
            {t('register.login')}
          </label>
          <input
            id={loginId}
            type="text"
            autoComplete="username"
            required
            minLength={LOGIN_MIN_LENGTH}
            maxLength={LOGIN_MAX_LENGTH}
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            aria-describedby={`${loginId}-hint`}
            className={inputClassName}
          />
          <p id={`${loginId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
            {t('register.loginRules', { min: LOGIN_MIN_LENGTH, max: LOGIN_MAX_LENGTH })}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={emailId} className="text-sm font-medium">
            {t('register.email')}
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={`${emailId}-hint`}
            className={inputClassName}
          />
          <p id={`${emailId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
            {t('register.emailWhy')}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={passwordId} className="text-sm font-medium">
            {t('register.password')}
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={`${passwordId}-hint`}
            className={inputClassName}
          />
          <p id={`${passwordId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
            {t('password.minLength', { min: PASSWORD_MIN_LENGTH })}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={repeatId} className="text-sm font-medium">
            {t('register.repeat')}
          </label>
          <input
            id={repeatId}
            type="password"
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
            className={inputClassName}
          />
        </div>

        <Recaptcha onToken={setCaptcha} resetSignal={resetSignal} />

        <Button type="submit" disabled={isBusy} className="self-start">
          {isBusy ? t('register.submitting') : t('register.submit')}
        </Button>

        {error === null ? null : (
          <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
            {error}
          </p>
        )}
      </form>

      <p className="mt-3 text-sm">
        <a
          href={withBasePath('/privacy/')}
          className="text-aubergine-700 underline dark:text-orange-400"
        >
          {t('privacy.link')}
        </a>
      </p>

      <p className="mt-1 text-sm">
        <button
          type="button"
          onClick={onCancel}
          className="text-aubergine-700 underline dark:text-orange-400"
        >
          {t('register.backToSignIn')}
        </button>
      </p>
    </section>
  )
}
