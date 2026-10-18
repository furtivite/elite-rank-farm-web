'use client'

import { RETURN_REMINDERS_STORAGE_KEY } from '@/shared/config/storageKeys'
import type { ReturnReminder } from '@/entities/mission-store/model/types'
import { createDemoCopy } from '@/shared/lib/demoSandbox'

const EMPTY: ReturnReminder[] = []

let snapshot: ReturnReminder[] = EMPTY
let initialized = false
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

const demo = createDemoCopy<ReturnReminder[]>(emit)

function parse(value: unknown): ReturnReminder[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: ReturnReminder[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const record = item as Record<string, unknown>
    const { id, systemName, stationName, createdAt } = record

    if (
      typeof id !== 'string' ||
      typeof systemName !== 'string' ||
      typeof stationName !== 'string' ||
      typeof createdAt !== 'string' ||
      id === '' ||
      systemName === '' ||
      stationName === ''
    ) {
      continue
    }

    result.push({
      id,
      systemName,
      stationName,
      fromStation: typeof record.fromStation === 'string' ? record.fromStation : undefined,
      createdAt,
    })
  }

  return result
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true

  try {
    const raw = localStorage.getItem(RETURN_REMINDERS_STORAGE_KEY)
    snapshot = raw === null ? EMPTY : parse(JSON.parse(raw))
  } catch {
    snapshot = EMPTY
  }
}

export function getReturnRemindersSnapshot(): ReturnReminder[] {
  ensureInitialized()
  return demo.read(snapshot)
}

export function getServerReturnRemindersSnapshot(): ReturnReminder[] {
  return EMPTY
}

export function subscribeToReturnReminders(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeReturnReminders(next: ReturnReminder[]): void {
  if (demo.write(next)) {
    return
  }
  ensureInitialized()
  snapshot = next

  try {
    localStorage.setItem(RETURN_REMINDERS_STORAGE_KEY, JSON.stringify(next))
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
