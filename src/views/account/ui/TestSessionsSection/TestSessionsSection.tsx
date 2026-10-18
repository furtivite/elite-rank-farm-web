'use client'

import { useState } from 'react'
import { signOutTestUsers } from '@/entities/session'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'

export function TestSessionsSection() {
  const t = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const run = async () => {
    setIsBusy(true)
    setResult(null)

    const response = await signOutTestUsers()
    setIsBusy(false)
    setIsConfirming(false)
    setResult(response.ok ? t('testSessions.done') : response.message)
  }

  return (
    <section aria-labelledby="test-sessions-heading" className="flex flex-col gap-2">
      <h3 id="test-sessions-heading" className="text-base font-semibold">
        {t('testSessions.heading')}
      </h3>
      <p className="text-sm text-warm-700 dark:text-warm-300">{t('testSessions.explanation')}</p>

      <div className="flex flex-wrap gap-2">
        {isConfirming ? (
          <>
            <Button type="button" onClick={() => void run()} disabled={isBusy}>
              {isBusy ? t('testSessions.ending') : t('testSessions.confirm')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsConfirming(false)}>
              {t('sessions.cancel')}
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setIsConfirming(true)}>
            {t('testSessions.end')}
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
