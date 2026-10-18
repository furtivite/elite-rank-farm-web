'use client'

import { RESULTS_ORDER_STORAGE_KEY } from '@/shared/config/storageKeys'

export type ResultsOrder = 'nearest' | 'best'

export const DEFAULT_RESULTS_ORDER: ResultsOrder = 'nearest'

let snapshot: ResultsOrder = DEFAULT_RESULTS_ORDER
let initialized = false
const listeners = new Set<() => void>()

function readStored(): ResultsOrder {
  try {
    return localStorage.getItem(RESULTS_ORDER_STORAGE_KEY) === 'best' ? 'best' : 'nearest'
  } catch {
    return DEFAULT_RESULTS_ORDER
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  snapshot = readStored()
}

export function getResultsOrderSnapshot(): ResultsOrder {
  ensureInitialized()
  return snapshot
}

export function getServerResultsOrderSnapshot(): ResultsOrder {
  return DEFAULT_RESULTS_ORDER
}

export function subscribeToResultsOrder(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeResultsOrder(order: ResultsOrder): void {
  initialized = true
  snapshot = order

  try {
    if (order === DEFAULT_RESULTS_ORDER) {
      localStorage.removeItem(RESULTS_ORDER_STORAGE_KEY)
    } else {
      localStorage.setItem(RESULTS_ORDER_STORAGE_KEY, order)
    }
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
