import { readThemePreference, writeThemePreference } from '@/shared/lib/theme/storage'
import type { ThemePreference } from '@/shared/lib/theme/types'

let snapshot: ThemePreference = 'system'
let initialized = false

const listeners = new Set<() => void>()

export function getThemeSnapshot(): ThemePreference {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true
    snapshot = readThemePreference()
  }

  return snapshot
}

export function getServerThemeSnapshot(): ThemePreference {
  return 'system'
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeTheme(preference: ThemePreference): void {
  initialized = true
  snapshot = preference
  writeThemePreference(preference)
  for (const listener of listeners) {
    listener()
  }
}
