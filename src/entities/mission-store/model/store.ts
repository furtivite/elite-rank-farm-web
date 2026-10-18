import { loadMissions, saveMissions } from '@/entities/mission-store/model/storage'
import type { StoredMission } from '@/entities/mission-store/model/types'
import { createDemoCopy } from '@/shared/lib/demoSandbox'

const EMPTY: StoredMission[] = []

let snapshot: StoredMission[] = EMPTY
let initialized = false

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

let demoSeed: StoredMission[] | null = null
const demo = createDemoCopy<StoredMission[]>(emit)

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = loadMissions()
}

export function getMissionsSnapshot(): StoredMission[] {
  ensureInitialized()
  return demo.read(demoSeed ?? snapshot)
}

export function setMissionDemoSeed(seed: StoredMission[] | null): void {
  if (seed === demoSeed) {
    return
  }
  demoSeed = seed
  demo.reset()
  emit()
}

export function getServerMissionsSnapshot(): StoredMission[] {
  return EMPTY
}

export function subscribeToMissions(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const forgetListeners = new Set<(missionIds: readonly string[]) => void>()

export function subscribeToForgottenMissions(
  listener: (missionIds: readonly string[]) => void,
): () => void {
  forgetListeners.add(listener)
  return () => {
    forgetListeners.delete(listener)
  }
}

function notifyForgotten(before: readonly StoredMission[], after: readonly StoredMission[]): void {
  if (before.length === 0) {
    return
  }

  const remaining = new Set(after.map((mission) => mission.id))
  const gone = before.filter((mission) => !remaining.has(mission.id)).map((mission) => mission.id)

  if (gone.length === 0) {
    return
  }

  for (const listener of forgetListeners) {
    listener(gone)
  }
}

export function writeMissions(next: StoredMission[]): void {
  if (demo.write(next)) {
    return
  }
  ensureInitialized()
  const before = snapshot
  snapshot = next
  saveMissions(next)
  notifyForgotten(before, next)
  emit()
}

export function _resetMissionStoreForTests(): void {
  snapshot = EMPTY
  initialized = false
  demoSeed = null
  demo.reset()
  listeners.clear()
}
