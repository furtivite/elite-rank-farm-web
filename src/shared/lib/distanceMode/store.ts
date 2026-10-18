'use client'

import { DISTANCE_MODE_STORAGE_KEY } from '@/shared/config/storageKeys'

export type DistanceMode = 'straight' | 'jumps'

export const DEFAULT_DISTANCE_MODE: DistanceMode = 'straight'

let snapshot: DistanceMode = DEFAULT_DISTANCE_MODE
let initialized = false
const listeners = new Set<() => void>()

function readStored(): DistanceMode {
  try {
    return localStorage.getItem(DISTANCE_MODE_STORAGE_KEY) === 'jumps' ? 'jumps' : 'straight'
  } catch {
    return DEFAULT_DISTANCE_MODE
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = readStored()
}

export function getDistanceModeSnapshot(): DistanceMode {
  ensureInitialized()
  return snapshot
}

export function getServerDistanceModeSnapshot(): DistanceMode {
  return DEFAULT_DISTANCE_MODE
}

export function subscribeToDistanceMode(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeDistanceMode(mode: DistanceMode): void {
  initialized = true
  snapshot = mode

  try {
    if (mode === DEFAULT_DISTANCE_MODE) {
      localStorage.removeItem(DISTANCE_MODE_STORAGE_KEY)
    } else {
      localStorage.setItem(DISTANCE_MODE_STORAGE_KEY, mode)
    }
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
