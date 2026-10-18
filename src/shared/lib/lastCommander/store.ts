import { LAST_COMMANDER_STORAGE_KEY } from '@/shared/config/storageKeys'

let snapshot: string | null = null
let initialized = false

const listeners = new Set<() => void>()

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true

  try {
    const raw = localStorage.getItem(LAST_COMMANDER_STORAGE_KEY)
    snapshot = raw === null || raw === '' ? null : raw
  } catch {}
}

export function getLastCommanderSnapshot(): string | null {
  ensureInitialized()
  return snapshot
}

export function getServerLastCommanderSnapshot(): string | null {
  return null
}

export function subscribeToLastCommander(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function rememberCommander(name: string | null): void {
  ensureInitialized()
  const next = name === null || name === '' ? null : name
  if (next === snapshot) {
    return
  }
  snapshot = next

  try {
    if (next === null) {
      localStorage.removeItem(LAST_COMMANDER_STORAGE_KEY)
    } else {
      localStorage.setItem(LAST_COMMANDER_STORAGE_KEY, next)
    }
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
