'use client'

import { setStationStarMark } from '@/entities/galaxy-data/api/setStationStarMark'

let overrides = new Map<string, boolean>()

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeToStarMarks(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getStarMarkSnapshot(): ReadonlyMap<string, boolean> {
  return overrides
}

export function getServerStarMarkSnapshot(): ReadonlyMap<string, boolean> {
  return EMPTY
}

const EMPTY: ReadonlyMap<string, boolean> = new Map()

export async function toggleStarMark(stationId: string, marked: boolean): Promise<boolean> {
  const previous = overrides.get(stationId)

  overrides = new Map(overrides).set(stationId, marked)
  emit()

  const ok = await setStationStarMark(stationId, marked)
  if (ok) {
    return true
  }

  const rolledBack = new Map(overrides)
  if (previous === undefined) {
    rolledBack.delete(stationId)
  } else {
    rolledBack.set(stationId, previous)
  }
  overrides = rolledBack
  emit()

  return false
}

export function _resetStarMarksForTests(): void {
  overrides = new Map()
  emit()
}
