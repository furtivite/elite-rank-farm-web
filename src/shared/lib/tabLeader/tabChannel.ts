'use client'

import type { CommanderStateResponse } from '@/entities/commander-state'

const CHANNEL_NAME = 'elite:tabs'

export type TabMessage =
  | { type: 'commander-state'; payload: CommanderStateResponse | null }
  | { type: 'journal-missions'; payload: unknown }

function channel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null
  }

  return new BroadcastChannel(CHANNEL_NAME)
}

let shared: BroadcastChannel | null | undefined

function instance(): BroadcastChannel | null {
  if (shared === undefined) {
    shared = channel()
  }

  return shared
}

export function publishToTabs(message: TabMessage): void {
  try {
    instance()?.postMessage(message)
  } catch {}
}

export function subscribeToTabs(listener: (message: TabMessage) => void): () => void {
  const bus = instance()
  if (bus === null) {
    return () => {}
  }

  const handler = (event: MessageEvent<TabMessage>) => {
    if (typeof event.data === 'object' && event.data !== null && 'type' in event.data) {
      listener(event.data)
    }
  }

  bus.addEventListener('message', handler)

  return () => bus.removeEventListener('message', handler)
}
