'use client'

import { useCommanderState } from '@/entities/commander-state'
import { useSession } from '@/entities/session'
import { AppShell } from '@/widgets/app-shell'
import { OtherStarsList } from '@/widgets/other-stars'

export function OtherStarsPage() {
  const session = useSession()
  const commander = useCommanderState(
    session.status === 'user',
    session.user?.isTestUser === true,
    session.status === 'guest',
  )

  return (
    <AppShell activeNav="other-stars" commander={commander} session={session}>
      <OtherStarsList />
    </AppShell>
  )
}
