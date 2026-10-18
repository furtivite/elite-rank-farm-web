'use client'

import { POSITION_HISTORY_STORAGE_KEY } from '@/shared/config/storageKeys'

export type PositionVisit = {
  systemName: string
  at: string
}

export const POSITION_HISTORY_LIMIT = 20

export function recordVisit(
  history: readonly PositionVisit[],
  systemName: string,
  at: string,
): PositionVisit[] {
  const name = systemName.trim()
  if (name === '') {
    return [...history]
  }

  const [last, ...rest] = history
  if (last !== undefined && last.systemName === name) {
    return [{ systemName: name, at }, ...rest]
  }

  return [{ systemName: name, at }, ...history].slice(0, POSITION_HISTORY_LIMIT)
}

export function isShuttling(
  history: readonly PositionVisit[],
  here: string,
  there: string,
): boolean {
  if (here === there) {
    return false
  }

  const [first, second, third] = history
  return first?.systemName === here && second?.systemName === there && third?.systemName === here
}

export function mergeHistories(
  local: readonly PositionVisit[],
  fromAgent: readonly PositionVisit[],
): PositionVisit[] {
  if (fromAgent.length === 0) {
    return [...local]
  }
  if (local.length === 0) {
    return [...fromAgent]
  }

  const [newer, older] =
    Date.parse(fromAgent[0]!.at) >= Date.parse(local[0]!.at)
      ? [fromAgent, local]
      : [local, fromAgent]

  const merged: PositionVisit[] = []
  for (const visit of [...newer, ...older]) {
    const last = merged[merged.length - 1]
    if (last?.systemName === visit.systemName) {
      continue
    }
    merged.push(visit)
  }

  return merged.slice(0, POSITION_HISTORY_LIMIT)
}

function parse(raw: string | null): PositionVisit[] {
  if (raw === null) {
    return []
  }

  try {
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .filter(
        (entry): entry is PositionVisit =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as PositionVisit).systemName === 'string' &&
          (entry as PositionVisit).systemName !== '' &&
          typeof (entry as PositionVisit).at === 'string',
      )
      .slice(0, POSITION_HISTORY_LIMIT)
  } catch {
    return []
  }
}

let snapshot: PositionVisit[] = []
let initialized = false
const listeners = new Set<() => void>()

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  try {
    snapshot = parse(localStorage.getItem(POSITION_HISTORY_STORAGE_KEY))
  } catch {
    snapshot = []
  }
}

export function getPositionHistorySnapshot(): readonly PositionVisit[] {
  ensureInitialized()
  return snapshot
}

export function getServerPositionHistorySnapshot(): readonly PositionVisit[] {
  return EMPTY
}

const EMPTY: readonly PositionVisit[] = []

export function subscribeToPositionHistory(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notePosition(systemName: string, at: string = new Date().toISOString()): void {
  ensureInitialized()

  const next = recordVisit(snapshot, systemName, at)
  const changed = next[0]?.systemName !== snapshot[0]?.systemName || next.length !== snapshot.length
  snapshot = next

  try {
    localStorage.setItem(POSITION_HISTORY_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {}

  if (changed) {
    for (const listener of listeners) {
      listener()
    }
  }
}
