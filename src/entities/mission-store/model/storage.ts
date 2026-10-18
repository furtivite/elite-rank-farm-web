import { MISSION_STORE_STORAGE_KEY } from '@/shared/config/storageKeys'
import { parseStoredMissions, serializeMissions } from '@/entities/mission-store/model/validate'
import type { StoredMission } from '@/entities/mission-store/model/types'

export function loadMissions(): StoredMission[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = localStorage.getItem(MISSION_STORE_STORAGE_KEY)
    if (raw === null) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    return parseStoredMissions(parsed)
  } catch {
    return []
  }
}

export function saveMissions(missions: readonly StoredMission[]): void {
  try {
    localStorage.setItem(MISSION_STORE_STORAGE_KEY, serializeMissions(missions))
  } catch {
    return
  }
}
