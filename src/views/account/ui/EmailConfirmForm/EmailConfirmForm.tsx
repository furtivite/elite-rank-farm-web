'use client'

import { useId, useState } from 'react'
import { confirmEmail, refreshSession, resendConfirmationCode } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { Recaptcha } from '@/shared/ui/Recaptcha'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

export type EmailConfirmFormProps = {
  initialLogin?: string
  initialPassword?: string
  remember?: boolean
  onCancel: () => void
}

export function EmailConfirmForm({
  initialLogin = '',
  initialPassword = '',
  remember = false,
  onCancel,
}: EmailConfirmFormProps) {
  const t = useTranslation()
  const loginId = useId()
  const passwordId = useId()
  const codeId = useId()

  const [login, setLogin] = useState(initialLogin)
  const [password, setPassword] = useState(initialPassword)
  const [code, setCode] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [captcha, setCaptcha] = useState<string | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendNote, setResendNote] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setIsBusy(true)
    const result = await confirmEmail(login, password, code, remember)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    await refreshSession()
  }

  const resend = async () => {
    setResendNote(null)
    setError(null)

    if (captcha === null) {
      setError(t('captcha.required'))
      return
    }

    setIsResending(true)
    const result = await resendConfirmationCode(login, password, captcha)
    setIsResending(false)

    setCaptcha(null)
    setResetSignal((value) => value + 1)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setResendNote(result.message)
  }

  return (
    <section aria-labelledby="confirm-heading" className="max-w-sm">
      <h3 id="confirm-heading" className="text-base font-semibold">
        {t('confirm.heading')}
      </h3>

      <p className="mt-2 text-sm text-warm-700 dark:text-warm-300">{t('confirm.explanation')}</p>

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
          <label htmlFor={codeId} className="text-sm font-medium">
            {t('confirm.code')}
          </label>
          <input
            id={codeId}
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            required
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-describedby={`${codeId}-hint`}
            className={inputClassName}
          />
          <p id={`${codeId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
            {t('confirm.codeHint')}
          </p>
        </div>

        <Button type="submit" disabled={isBusy} className="self-start">
          {isBusy ? t('confirm.submitting') : t('confirm.submit')}
        </Button>

        {error === null ? null : (
          <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
            {error}
          </p>
        )}

        {resendNote === null ? null : (
          <p role="status" className="text-sm text-warm-700 dark:text-warm-300">
            {resendNote}
          </p>
        )}
      </form>

      <details className="mt-3 rounded-md border border-warm-300 dark:border-warm-700">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400 [&::-webkit-details-marker]:hidden">
          {t('confirm.resend')}
        </summary>

        <div className="flex flex-col gap-3 p-2 pt-0">
          <p className="text-sm text-warm-700 dark:text-warm-300">{t('confirm.resendHint')}</p>

          <Recaptcha onToken={setCaptcha} resetSignal={resetSignal} />

          <Button
            type="button"
            variant="secondary"
            disabled={isResending}
            onClick={() => void resend()}
            className="self-start"
          >
            {isResending ? t('confirm.resending') : t('confirm.resendSubmit')}
          </Button>
        </div>
      </details>

      <p className="mt-3 text-sm">
        <button
          type="button"
          onClick={onCancel}
          className="text-aubergine-700 underline dark:text-orange-400"
        >
          {t('confirm.backToSignIn')}
        </button>
      </p>
    </section>
  )
}
