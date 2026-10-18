'use client'

import { useState } from 'react'
import { signOutOtherSessions } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'

export function OtherSessionsSection() {
  const t = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const run = async () => {
    setIsBusy(true)
    setResult(null)

    const response = await signOutOtherSessions()
    setIsBusy(false)
    setIsConfirming(false)
    setResult(response.ok ? t('sessions.done') : response.message)
  }

  return (
    <section aria-labelledby="sessions-heading" className="flex flex-col gap-2">
      <h3 id="sessions-heading" className="text-base font-semibold">
        {t('sessions.heading')}
      </h3>
      <p className="text-sm text-warm-700 dark:text-warm-300">{t('sessions.explanation')}</p>

      <div className="flex flex-wrap gap-2">
        {isConfirming ? (
          <>
            <Button type="button" onClick={() => void run()} disabled={isBusy}>
              {isBusy ? t('sessions.ending') : t('sessions.confirm')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsConfirming(false)}>
              {t('sessions.cancel')}
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setIsConfirming(true)}>
            {t('sessions.end')}
          </Button>
        )}
      </div>

      {result === null ? null : (
        <p role="status" className="text-sm text-warm-700 dark:text-warm-300">
          {result}
        </p>
      )}
    </section>
  )
}
