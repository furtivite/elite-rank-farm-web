'use client'

import { isDockedNow } from '@/entities/commander-state'
import { fetchJournalMissions } from '@/entities/mission-store/api/fetchJournalMissions'
import {
  parseJournalMissions,
  type JournalMission,
} from '@/entities/mission-store/model/journalTypes'
import { claimPollingRole, publishToTabs, subscribeToTabs } from '@/shared/lib/tabLeader'

export type JournalMissionsRead = {
  missions: JournalMission[]
  lastReadSucceeded: boolean
}

export const NOT_READ: JournalMissionsRead = { missions: [], lastReadSucceeded: false }

export const JOURNAL_POLL_TICK_MS = 5_000

export const UNDOCKED_EVERY_TICKS = 60

export function shouldReadJournal(tick: number, docked: boolean): boolean {
  return docked || tick % UNDOCKED_EVERY_TICKS === 0
}

let snapshot: JournalMissionsRead = NOT_READ
let subscribers = 0
let stop: (() => void) | null = null

const listeners = new Set<() => void>()

function setSnapshot(next: JournalMissionsRead): void {
  snapshot = next
  for (const listener of listeners) {
    listener()
  }
}

async function read(): Promise<void> {
  const result = await fetchJournalMissions()
  if (subscribers === 0) {
    return
  }

  if (result.status === 'success') {
    setSnapshot({ missions: result.missions, lastReadSucceeded: true })
    publishToTabs({ type: 'journal-missions', payload: { missions: result.missions } })
    return
  }

  setSnapshot(NOT_READ)
}

function start(): () => void {
  void read()

  let tick = 0
  const refreshIfVisible = (fromTimer: boolean) => {
    if (document.visibilityState !== 'visible') {
      return
    }

    if (fromTimer) {
      tick += 1
      if (!shouldReadJournal(tick, isDockedNow()) || !claimPollingRole()) {
        return
      }
    }

    void read()
  }

  const onTimer = () => refreshIfVisible(true)
  const onVisibility = () => refreshIfVisible(false)

  const timer = window.setInterval(onTimer, JOURNAL_POLL_TICK_MS)
  document.addEventListener('visibilitychange', onVisibility)

  const unsubscribe = subscribeToTabs((message) => {
    if (message.type !== 'journal-missions') {
      return
    }
    const missions = parseJournalMissions(message.payload)
    if (missions !== null) {
      setSnapshot({ missions, lastReadSucceeded: true })
    }
  })

  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
    unsubscribe()
  }
}

export function retainJournalMissionsPoll(): () => void {
  subscribers += 1
  if (subscribers === 1) {
    stop = start()
  }

  let released = false
  return () => {
    if (released) {
      return
    }
    released = true
    subscribers -= 1
    if (subscribers === 0) {
      stop?.()
      stop = null
      setSnapshot(NOT_READ)
    }
  }
}

export function getJournalMissionsSnapshot(): JournalMissionsRead {
  return snapshot
}

export function getServerJournalMissionsSnapshot(): JournalMissionsRead {
  return NOT_READ
}

export function subscribeToJournalMissions(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function _resetJournalMissionsPollForTests(): void {
  stop?.()
  stop = null
  subscribers = 0
  snapshot = NOT_READ
  listeners.clear()
}
