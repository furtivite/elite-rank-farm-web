'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import {
  getCommanderSnapshot,
  getServerCommanderSnapshot,
  loadCommanderState,
  resetCommanderState,
  applyStateFromLeader,
  shouldSkipPoll,
  subscribeToCommander,
  type NavyProgress,
  type NavyProgressValue,
} from '@/entities/commander-state/model/commanderStore'
import {
  claimPollingRole,
  publishToTabs,
  releasePollingRole,
  subscribeToTabs,
} from '@/shared/lib/tabLeader'
import {
  getActiveScenario,
  getMockSnapshot,
  getServerMockSnapshot,
  setMockScenario,
  subscribeToMock,
} from '@/entities/commander-state/model/mockStore'
import type { JournalMission, StoredMission } from '@/entities/mission-store'
import type {
  CommanderStateResponse,
  CommanderStateStatus,
} from '@/entities/commander-state/model/types'

export const COMMANDER_POLL_INTERVAL_MS = 10_000

const POLL_INTERVAL_MS = COMMANDER_POLL_INTERVAL_MS

export type { NavyProgress, NavyProgressValue }

export type UseCommanderStateResult = {
  status: CommanderStateStatus
  data: CommanderStateResponse | null
  progress: NavyProgress | null
  errorMessage: string | null
  agentUpdateRequired: boolean
  mockJournalMissions: JournalMission[] | null
  mockManualMissions: StoredMission[] | null
  isSignedIn: boolean
  refresh: () => void
}

export function useCommanderState(
  isSignedIn: boolean,
  isTestUser = false,
  isSignedOut = false,
): UseCommanderStateResult {
  const state = useSyncExternalStore(
    subscribeToCommander,
    getCommanderSnapshot,
    getServerCommanderSnapshot,
  )

  const mockId = useSyncExternalStore(subscribeToMock, getMockSnapshot, getServerMockSnapshot)
  const scenario = isTestUser ? getActiveScenario(mockId) : null

  useEffect(() => {
    if (!isSignedIn) {
      if (isSignedOut) {
        resetCommanderState()
        setMockScenario('off')
      }
      return
    }

    void loadCommanderState(state.data !== null)

    let tick = 0
    const refreshIfVisible = (fromTimer: boolean) => {
      if (document.visibilityState !== 'visible') {
        return
      }

      if (fromTimer) {
        tick += 1
        if (shouldSkipPoll(tick)) {
          return
        }

        if (!claimPollingRole()) {
          return
        }
      }

      void loadCommanderState(true).then(() => {
        const snapshot = getCommanderSnapshot()
        if (snapshot.status === 'success' || snapshot.status === 'not-found') {
          publishToTabs({ type: 'commander-state', payload: snapshot.data })
        }
      })
    }

    const onTimer = () => refreshIfVisible(true)
    const onVisibility = () => refreshIfVisible(false)

    const timer = window.setInterval(onTimer, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisibility)

    const unsubscribe = subscribeToTabs((message) => {
      if (message.type === 'commander-state') {
        applyStateFromLeader(message.payload)
      }
    })

    window.addEventListener('pagehide', releasePollingRole)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', releasePollingRole)
      unsubscribe()
      releasePollingRole()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isSignedOut])

  const refresh = useCallback(() => {
    void loadCommanderState()
  }, [])

  if (scenario !== null) {
    return {
      status: scenario.status,
      data: scenario.data,
      agentUpdateRequired: scenario.data?.agentUpdateRequired === true,
      progress:
        scenario.progress ??
        (scenario.data === null
          ? null
          : {
              imperial: {
                percent: scenario.data.state.imperialProgress,
                at: scenario.data.state.imperialProgressAt,
              },
              federal: {
                percent: scenario.data.state.federalProgress,
                at: scenario.data.state.federalProgressAt,
              },
            }),
      errorMessage: scenario.errorMessage,
      mockJournalMissions: scenario.journalMissions ?? null,
      mockManualMissions: scenario.manualMissions ?? null,
      isSignedIn,
      refresh,
    }
  }

  return {
    status: isSignedIn ? state.status : 'guest',
    data: isSignedIn ? state.data : null,
    progress: isSignedIn ? state.progress : null,
    errorMessage: isSignedIn ? state.errorMessage : null,
    agentUpdateRequired:
      isSignedIn && (state.data?.agentUpdateRequired === true || state.agentUpdateRequired),
    mockJournalMissions: null,
    mockManualMissions: null,
    isSignedIn,
    refresh,
  }
}
