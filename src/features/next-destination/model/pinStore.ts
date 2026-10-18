import { NEXT_DESTINATION_PIN_STORAGE_KEY } from '@/shared/config/storageKeys'
import type { PinnedTarget } from '@/features/next-destination/lib/pickNextDestination'
import { createDemoCopy } from '@/shared/lib/demoSandbox'

let snapshot: PinnedTarget | null = null
let initialized = false

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

const demo = createDemoCopy<PinnedTarget | null>(emit)

function load(): PinnedTarget | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(NEXT_DESTINATION_PIN_STORAGE_KEY)
    if (raw === null) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const { systemKey, stationKey } = parsed as { systemKey?: unknown; stationKey?: unknown }
    if (typeof systemKey !== 'string') {
      return null
    }

    return { systemKey, stationKey: typeof stationKey === 'string' ? stationKey : null }
  } catch {
    return null
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = load()
}

export function getPinSnapshot(): PinnedTarget | null {
  ensureInitialized()
  return demo.read(snapshot)
}

export function getServerPinSnapshot(): PinnedTarget | null {
  return null
}

export function subscribeToPin(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writePin(next: PinnedTarget | null): void {
  if (demo.write(next)) {
    return
  }
  ensureInitialized()
  snapshot = next

  try {
    if (next === null) {
      localStorage.removeItem(NEXT_DESTINATION_PIN_STORAGE_KEY)
    } else {
      localStorage.setItem(NEXT_DESTINATION_PIN_STORAGE_KEY, JSON.stringify(next))
    }
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}

export function _resetPinStoreForTests(): void {
  initialized = false
  snapshot = null
  demo.reset()
}
