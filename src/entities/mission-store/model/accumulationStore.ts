import {
  ACCUMULATION_DEFAULTS,
  normalizeThresholds,
  type AccumulationThresholds,
} from '@/entities/mission-store/lib/accumulation'
import { ACCUMULATION_STORAGE_KEY } from '@/shared/config/storageKeys'

const listeners = new Set<() => void>()

let snapshot: AccumulationThresholds = ACCUMULATION_DEFAULTS
let isRead = false

function read(): AccumulationThresholds {
  try {
    const raw = window.localStorage.getItem(ACCUMULATION_STORAGE_KEY)
    if (raw === null) {
      return ACCUMULATION_DEFAULTS
    }

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return ACCUMULATION_DEFAULTS
    }

    const { reasonable, high } = parsed as Partial<AccumulationThresholds>
    if (typeof reasonable !== 'number' || typeof high !== 'number') {
      return ACCUMULATION_DEFAULTS
    }

    return normalizeThresholds({ reasonable, high })
  } catch {
    return ACCUMULATION_DEFAULTS
  }
}

export function subscribeToAccumulation(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAccumulationSnapshot(): AccumulationThresholds {
  if (!isRead) {
    snapshot = read()
    isRead = true
  }

  return snapshot
}

export function getServerAccumulationSnapshot(): AccumulationThresholds {
  return ACCUMULATION_DEFAULTS
}

export function setAccumulationThresholds(next: AccumulationThresholds): void {
  snapshot = normalizeThresholds(next)
  isRead = true

  try {
    window.localStorage.setItem(ACCUMULATION_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}

export function _resetAccumulationForTests(): void {
  snapshot = ACCUMULATION_DEFAULTS
  isRead = false
}
