import { MANUAL_MISSIONS_STORAGE_KEY } from '@/shared/config/storageKeys'

export type ManualMissionSettings = {
  addManually: boolean
  excludeFromCount: boolean
}

const DEFAULTS: ManualMissionSettings = {
  addManually: true,
  excludeFromCount: false,
}

let snapshot: ManualMissionSettings = DEFAULTS
let initialized = false

const listeners = new Set<() => void>()

function read(): ManualMissionSettings {
  try {
    const raw = localStorage.getItem(MANUAL_MISSIONS_STORAGE_KEY)
    if (raw === null) {
      return DEFAULTS
    }

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULTS
    }

    const record = parsed as Record<string, unknown>

    return {
      addManually:
        typeof record.addManually === 'boolean' ? record.addManually : DEFAULTS.addManually,
      excludeFromCount:
        typeof record.excludeFromCount === 'boolean'
          ? record.excludeFromCount
          : DEFAULTS.excludeFromCount,
    }
  } catch {
    return DEFAULTS
  }
}

export function getManualMissionSettings(): ManualMissionSettings {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true
    snapshot = read()
  }

  return snapshot
}

export function getServerManualMissionSettings(): ManualMissionSettings {
  return DEFAULTS
}

export function subscribeToManualMissionSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setManualMissionSettings(next: Partial<ManualMissionSettings>): void {
  const merged = { ...getManualMissionSettings(), ...next }
  if (
    merged.addManually === snapshot.addManually &&
    merged.excludeFromCount === snapshot.excludeFromCount
  ) {
    return
  }

  snapshot = merged

  try {
    localStorage.setItem(MANUAL_MISSIONS_STORAGE_KEY, JSON.stringify(merged))
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
