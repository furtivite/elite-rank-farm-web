'use client'

import { useId, useState } from 'react'
import { changePassword } from '@/entities/session'
import { PASSWORD_MIN_LENGTH } from '@/shared/config/accountRules'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

type PasswordSectionProps = {
  passwordResetEnabled?: boolean
}

export function PasswordSection({ passwordResetEnabled = false }: PasswordSectionProps) {
  const t = useTranslation()
  const currentId = useId()
  const nextId = useId()
  const repeatId = useId()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setError(null)
    setDone(false)

    if (next !== repeat) {
      setError(t('password.mismatch'))
      return
    }

    setIsBusy(true)
    const result = await changePassword(current, next)
    setIsBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setCurrent('')
    setNext('')
    setRepeat('')
    setDone(true)
  }

  return (
    <section aria-labelledby="password-heading" className="flex flex-col gap-2">
      <h3 id="password-heading" className="text-base font-semibold">
        {t('password.heading')}
      </h3>

      <details className="rounded-md border border-warm-300 dark:border-warm-700">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400 [&::-webkit-details-marker]:hidden">
          {t('password.summary')}
        </summary>

        <form
          className="flex max-w-sm flex-col gap-3 p-2 pt-0"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <p className="text-sm text-warm-700 dark:text-warm-300">{t('password.explanation')}</p>

          {passwordResetEnabled ? (
            <p className="text-sm text-warm-700 dark:text-warm-300">
              {t('password.forgotHint')}{' '}
              <a href="../reset/" className="text-aubergine-700 underline dark:text-orange-400">
                {t('password.forgotLink')}
              </a>
            </p>
          ) : null}

          <div className="flex flex-col gap-1">
            <label htmlFor={currentId} className="text-sm font-medium">
              {t('password.current')}
            </label>
            <input
              id={currentId}
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={nextId} className="text-sm font-medium">
              {t('password.new')}
            </label>
            <input
              id={nextId}
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
              value={next}
              onChange={(event) => setNext(event.target.value)}
              aria-describedby={`${nextId}-hint`}
              className={inputClassName}
            />
            <p id={`${nextId}-hint`} className="text-xs text-warm-600 dark:text-warm-400">
              {t('password.minLength', { min: PASSWORD_MIN_LENGTH })}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={repeatId} className="text-sm font-medium">
              {t('password.repeat')}
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

          <Button type="submit" disabled={isBusy} className="self-start">
            {isBusy ? t('password.submitting') : t('password.summary')}
          </Button>

          {error === null ? null : (
            <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
              {error}
            </p>
          )}

          {done ? (
            <p role="status" className="text-sm text-warm-700 dark:text-warm-300">
              {t('password.changed')}
            </p>
          ) : null}
        </form>
      </details>
    </section>
  )
}
