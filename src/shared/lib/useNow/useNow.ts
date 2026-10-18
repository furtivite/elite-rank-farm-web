'use client'

import { useSyncExternalStore } from 'react'

const TICK_MS = 60_000

const listeners = new Set<() => void>()

let current: number | null = null
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(listener: () => void): () => void {
  listeners.add(listener)

  timer ??= setInterval(() => {
    current = Date.now()
    for (const each of listeners) {
      each()
    }
  }, TICK_MS)

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
      current = null
    }
  }
}

function getSnapshot(): number | null {
  current ??= Date.now()
  return current
}

function getServerSnapshot(): number | null {
  return null
}

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
