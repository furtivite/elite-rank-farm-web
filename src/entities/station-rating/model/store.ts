import {
  clearStationRatings,
  loadStationRatings,
  saveStationRatings,
} from '@/entities/station-rating/model/storage'
import type { StationRatingsMap } from '@/entities/station-rating/model/types'
import { createDemoCopy, isDemoSandboxActive } from '@/shared/lib/demoSandbox'

const EMPTY: StationRatingsMap = {}

let snapshot: StationRatingsMap = EMPTY
let initialized = false

const listeners = new Set<() => void>()

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = loadStationRatings()
}

export function getRatingsSnapshot(): StationRatingsMap {
  ensureInitialized()
  return demo.read(snapshot)
}

export function getServerRatingsSnapshot(): StationRatingsMap {
  return EMPTY
}

export function subscribeToRatings(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

const demo = createDemoCopy<StationRatingsMap>(emit)

export function writeRatings(next: StationRatingsMap): void {
  if (demo.write(next)) {
    return
  }
  ensureInitialized()
  snapshot = next
  saveStationRatings(next)
  emit()
}

const forgetListeners = new Set<(stationId: string) => void>()

export function subscribeToForgottenStations(listener: (stationId: string) => void): () => void {
  forgetListeners.add(listener)
  return () => {
    forgetListeners.delete(listener)
  }
}

export function notifyStationForgotten(stationId: string): void {
  if (isDemoSandboxActive()) {
    return
  }

  for (const listener of forgetListeners) {
    listener(stationId)
  }
}

export function resetRatings(): void {
  if (demo.write(EMPTY)) {
    return
  }
  initialized = true
  snapshot = EMPTY
  clearStationRatings()
  emit()
}
