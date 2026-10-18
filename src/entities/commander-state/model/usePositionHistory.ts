'use client'

import { useEffect, useSyncExternalStore } from 'react'
import {
  getPositionHistorySnapshot,
  mergeHistories,
  getServerPositionHistorySnapshot,
  notePosition,
  subscribeToPositionHistory,
  type PositionVisit,
} from '@/entities/commander-state/model/positionHistory'

export function usePositionHistory(
  systemName: string | null | undefined,
  observedAt?: string | null,
  fromAgent?: readonly PositionVisit[],
): readonly PositionVisit[] {
  useEffect(() => {
    if (systemName == null || systemName === '') {
      return
    }

    notePosition(systemName, observedAt ?? undefined)
  }, [systemName, observedAt])

  const local = useSyncExternalStore(
    subscribeToPositionHistory,
    getPositionHistorySnapshot,
    getServerPositionHistorySnapshot,
  )

  return fromAgent === undefined || fromAgent.length === 0
    ? local
    : mergeHistories(local, fromAgent)
}
