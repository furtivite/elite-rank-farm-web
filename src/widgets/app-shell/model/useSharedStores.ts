import { useEffect } from 'react'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import { setMissionDemoSeed } from '@/entities/mission-store'
import type { UseSessionResult } from '@/entities/session'
import { useFarmClustersSync } from '@/features/farm-clusters-sync'
import { useMissionStoreSync } from '@/features/mission-store-sync'
import { useStationRatingsSync } from '@/features/station-ratings-sync'
import { useViewPreferencesSync } from '@/features/view-preferences'
import { setDemoSandboxActive } from '@/shared/lib/demoSandbox'

export function useSharedStores(session: UseSessionResult, commander: UseCommanderStateResult) {
  useViewPreferencesSync(session.status === 'user')
  useStationRatingsSync(session.status === 'user')
  useMissionStoreSync(session.status === 'user')
  useFarmClustersSync(session.status === 'user')
  useEffect(() => {
    setMissionDemoSeed(commander.mockManualMissions)
    setDemoSandboxActive(
      commander.mockJournalMissions !== null || commander.mockManualMissions !== null,
    )
  }, [commander.mockJournalMissions, commander.mockManualMissions])
}
