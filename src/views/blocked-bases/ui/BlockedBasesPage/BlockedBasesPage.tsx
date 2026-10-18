'use client'

import { useCommanderState } from '@/entities/commander-state'
import { useSession } from '@/entities/session'
import { AppShell } from '@/widgets/app-shell'
import { BlockedBasesList } from '@/widgets/blocked-bases'

export function BlockedBasesPage() {
  const session = useSession()
  const commander = useCommanderState(
    session.status === 'user',
    session.user?.isTestUser === true,
    session.status === 'guest',
  )

  return (
    <AppShell activeNav="blocked" commander={commander} session={session}>
      <BlockedBasesList />
    </AppShell>
  )
}
