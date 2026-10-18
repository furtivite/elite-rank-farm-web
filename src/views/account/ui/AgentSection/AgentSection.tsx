'use client'

import { useState } from 'react'
import { issueDeviceToken } from '@/entities/session'
import { AGENT_DOWNLOAD_URL } from '@/shared/config/downloads'
import { withBasePath } from '@/shared/config/basePath'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'

export function AgentSection({ isTestUser }: { isTestUser: boolean }) {
  const t = useTranslation()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  const issue = async () => {
    setIsBusy(true)
    setError(null)

    const result = await issueDeviceToken()
    setIsBusy(false)

    if (result.ok) {
      setToken(result.deviceToken)
    } else {
      setError(result.message)
    }
  }

  const downloadConfig = () => {
    if (token === null) {
      return
    }

    const baseUrl = new URL(withBasePath('/api'), window.location.origin).toString()
    const blob = new Blob([JSON.stringify({ baseUrl, deviceToken: token }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'elite-agent.json'

    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <section aria-labelledby="agent-heading" className="flex flex-col gap-2">
      <h3 id="agent-heading" className="text-base font-semibold">
        Windows Agent
      </h3>

      <p className="text-sm text-warm-700 dark:text-warm-300">{t('agent.explanation')}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void issue()}
          disabled={isBusy || isTestUser}
          aria-describedby={isTestUser ? 'agent-token-disabled' : undefined}
        >
          {isBusy ? t('agent.issuing') : token === null ? t('agent.issue') : t('agent.reissue')}
        </Button>
        {token === null ? null : (
          <Button type="button" variant="secondary" onClick={downloadConfig}>
            {t('agent.downloadConfig')}
          </Button>
        )}
      </div>

      {isTestUser ? (
        <p id="agent-token-disabled" className="text-sm text-warm-700 dark:text-warm-300">
          {t('agent.testUserNote')}
        </p>
      ) : null}

      {error === null ? null : (
        <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
          {error}
        </p>
      )}

      {token === null ? null : (
        <div
          role="status"
          className="rounded-md border border-caution-600 bg-caution-50 p-2 text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100"
        >
          <p className="text-sm font-medium">{t('agent.copyNow')}</p>
          <code className="mt-1 block break-all font-mono text-xs">{token}</code>
        </div>
      )}

      <p className="text-sm text-warm-700 dark:text-warm-300">
        {AGENT_DOWNLOAD_URL === null ? (
          <>{t('agent.noBuild')}</>
        ) : (
          <a
            href={AGENT_DOWNLOAD_URL}
            className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400"
          >
            {t('agent.downloadWindows')}
          </a>
        )}
      </p>
    </section>
  )
}
