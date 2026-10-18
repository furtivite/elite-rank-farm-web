'use client'

import { useEffect, useState } from 'react'
import { resubscribeEmails, unsubscribeEmails } from '@/entities/session'
import { withBasePath } from '@/shared/config/basePath'
import { Bilingual } from '@/shared/ui/Bilingual'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch'

export function UnsubscribePage() {
  const [link, setLink] = useState<{ user: number; signature: string } | null>(null)
  const [status, setStatus] = useState<'reading' | 'working' | 'done' | 'bad'>('reading')
  const [back, setBack] = useState<'idle' | 'working' | 'done'>('idle')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const user = Number(params.get('u'))
    const signature = params.get('sig') ?? ''

    if (!Number.isInteger(user) || user <= 0 || signature === '') {
      setStatus('bad')
      return
    }

    setLink({ user, signature })
    setStatus('working')

    void unsubscribeEmails(user, signature).then(() => {
      setStatus('done')
    })
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subscribeAgain = async () => {
    if (link === null) {
      return
    }

    setBack('working')
    await resubscribeEmails(link.user, link.signature)
    setBack('done')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-warm-50 text-warm-900 dark:bg-warm-950 dark:text-warm-100">
      <div className="flex justify-end p-2">
        <LanguageSwitch />
      </div>

      <main className="mx-auto flex w-full max-w-prose flex-1 flex-col gap-4 px-4 py-6">
        {status === 'bad' ? (
          <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
            <Bilingual k="unsubscribe.badLink" />
          </p>
        ) : (
          <>
            <h1 className="text-lg font-medium">
              {status === 'done' ? (
                <Bilingual k="unsubscribe.title" />
              ) : (
                <Bilingual k="unsubscribe.working" />
              )}
            </h1>

            <p className="text-sm">
              <Bilingual k="unsubscribe.sorry" />
            </p>

            <p className="text-sm text-warm-700 dark:text-warm-300">
              <Bilingual k="unsubscribe.stillReset" />
            </p>

            <section aria-labelledby="resubscribe-heading" className="mt-2 flex flex-col gap-2">
              <h2 id="resubscribe-heading" className="text-base font-medium">
                <Bilingual k="unsubscribe.backHeading" />
              </h2>
              <p className="text-sm">
                <Bilingual k="unsubscribe.back" />
              </p>

              {back === 'done' ? (
                <p role="status" className="text-sm text-warm-900 dark:text-warm-100">
                  <Bilingual k="unsubscribe.backDone" />
                </p>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={back === 'working' || status !== 'done'}
                  onClick={() => void subscribeAgain()}
                  className="self-start"
                >
                  {back === 'working' ? (
                    <Bilingual k="unsubscribe.backWorking" />
                  ) : (
                    <Bilingual k="unsubscribe.backSubmit" />
                  )}
                </Button>
              )}
            </section>
          </>
        )}

        <p className="mt-4 text-sm">
          <a href={withBasePath('/')} className="text-aubergine-700 underline dark:text-orange-400">
            <Bilingual k="unsubscribe.toSite" />
          </a>
        </p>
      </main>
    </div>
  )
}
