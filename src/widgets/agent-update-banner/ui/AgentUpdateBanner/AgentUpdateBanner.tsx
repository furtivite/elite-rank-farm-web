'use client'

import type { UseCommanderStateResult } from '@/entities/commander-state'
import { AGENT_DOWNLOAD_URL } from '@/shared/config/downloads'
import { useTranslation } from '@/shared/lib/i18n'

export function AgentUpdateBanner({ commander }: { commander: UseCommanderStateResult }) {
  const t = useTranslation()

  if (!commander.agentUpdateRequired) {
    return null
  }

  return (
    <div
      role="status"
      className="-mx-3 -mt-3 bg-aubergine-700 px-4 py-1.5 text-center text-sm font-medium text-white dark:bg-orange-500 dark:text-warm-950"
    >
      {t('agent.updateAvailable')}
      {AGENT_DOWNLOAD_URL !== null && (
        <>
          {' '}
          <a
            href={AGENT_DOWNLOAD_URL}
            className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            {t('agent.updateDownload')}
          </a>
        </>
      )}
    </div>
  )
}
