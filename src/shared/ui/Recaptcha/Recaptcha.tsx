'use client'

import { useEffect, useRef, useState } from 'react'
import { isRecaptchaConfigured, recaptchaSiteKey } from '@/shared/config/recaptcha'
import { useTranslation } from '@/shared/lib/i18n'

type Grecaptcha = {
  ready: (callback: () => void) => void
  render: (
    container: HTMLElement,
    parameters: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => number
  reset: (widgetId?: number) => void
}

const SCRIPT_ID = 'recaptcha-api'

let scriptPromise: Promise<void> | null = null

function loadApi(language: string): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('No document: the script belongs to the browser.'))
  }

  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing !== null) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://www.google.com/recaptcha/api.js?render=explicit&hl=${encodeURIComponent(language)}`
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => {
      scriptPromise = null
      reject(new Error('The reCAPTCHA script did not load.'))
    })

    document.head.append(script)
  })

  return scriptPromise
}

function grecaptchaOf(scope: typeof globalThis): Grecaptcha | null {
  const candidate = (scope as { grecaptcha?: unknown }).grecaptcha

  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof (candidate as { render?: unknown }).render === 'function'
  ) {
    return candidate as Grecaptcha
  }

  return null
}

export type RecaptchaProps = {
  onToken: (token: string | null) => void
  resetSignal?: number
}

export function Recaptcha({ onToken, resetSignal = 0 }: RecaptchaProps) {
  const t = useTranslation()
  const container = useRef<HTMLDivElement | null>(null)
  const widgetId = useRef<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')

  const notify = useRef(onToken)

  useEffect(() => {
    notify.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!isRecaptchaConfigured()) {
      return
    }

    let cancelled = false

    loadApi(t.language)
      .then(() => {
        if (cancelled || container.current === null) {
          return
        }

        const api = grecaptchaOf(globalThis)
        if (api === null) {
          setStatus('failed')
          return
        }

        api.ready(() => {
          if (cancelled || container.current === null || widgetId.current !== null) {
            return
          }

          widgetId.current = api.render(container.current, {
            sitekey: recaptchaSiteKey(),
            callback: (token) => notify.current(token),
            'expired-callback': () => notify.current(null),
            'error-callback': () => notify.current(null),
          })
          setStatus('ready')
        })
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('failed')
        }
      })

    return () => {
      cancelled = true
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resetSignal === 0 || widgetId.current === null) {
      return
    }

    grecaptchaOf(globalThis)?.reset(widgetId.current)
    notify.current(null)
  }, [resetSignal])

  if (!isRecaptchaConfigured()) {
    return (
      <p role="status" className="text-sm text-danger-700 dark:text-danger-400">
        {t('captcha.notConfigured')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div ref={container} />
      {status === 'loading' ? (
        <p className="text-sm text-warm-600 dark:text-warm-400">{t('captcha.loading')}</p>
      ) : null}
      {status === 'failed' ? (
        <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
          {t('captcha.unavailable')}
        </p>
      ) : null}
    </div>
  )
}
