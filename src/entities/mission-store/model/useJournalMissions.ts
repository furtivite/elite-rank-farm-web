'use client'

import { useEffect, useSyncExternalStore } from 'react'
import {
  getJournalMissionsSnapshot,
  getServerJournalMissionsSnapshot,
  retainJournalMissionsPoll,
  subscribeToJournalMissions,
  type JournalMissionsRead,
} from '@/entities/mission-store/model/journalMissionsPoll'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'

export type { JournalMissionsRead } from '@/entities/mission-store/model/journalMissionsPoll'

export function useJournalMissions(mocked: JournalMission[] | null = null): JournalMission[] {
  return useJournalMissionsRead(mocked).missions
}

export function useJournalMissionsRead(
  mocked: JournalMission[] | null = null,
): JournalMissionsRead {
  const read = useSyncExternalStore(
    subscribeToJournalMissions,
    getJournalMissionsSnapshot,
    getServerJournalMissionsSnapshot,
  )

  useEffect(() => {
    if (mocked !== null) {
      return
    }
    return retainJournalMissionsPoll()
  }, [mocked])

  return mocked === null ? read : { missions: mocked, lastReadSucceeded: true }
}
