'use client'

import { useSyncExternalStore } from 'react'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import { useTranslation } from '@/shared/lib/i18n'
import {
  getLastCommanderSnapshot,
  getServerLastCommanderSnapshot,
  subscribeToLastCommander,
} from '@/shared/lib/lastCommander'

export function CommanderHeading({ commander }: { commander: UseCommanderStateResult }) {
  const t = useTranslation()
  const remembered = useSyncExternalStore(
    subscribeToLastCommander,
    getLastCommanderSnapshot,
    getServerLastCommanderSnapshot,
  )

  const live = commander.data?.state.commanderName
  const name = live !== undefined && live !== '' ? live : remembered

  return (
    <h2 className="text-xl font-semibold">
      {name === null ? t('commander.heading') : t('commander.headingNamed', { name })}
    </h2>
  )
}
