'use client'

import { JUMP_MULTIPLIER_STORAGE_KEY } from '@/shared/config/storageKeys'

export const JUMP_MULTIPLIERS = [1, 2, 3, 4, 5] as const

export type JumpMultiplier = (typeof JUMP_MULTIPLIERS)[number]

export const DEFAULT_JUMP_MULTIPLIER: JumpMultiplier = 1

let snapshot: JumpMultiplier = DEFAULT_JUMP_MULTIPLIER
let initialized = false
const listeners = new Set<() => void>()

function parse(raw: string | null): JumpMultiplier {
  const value = Number(raw)
  return (JUMP_MULTIPLIERS as readonly number[]).includes(value)
    ? (value as JumpMultiplier)
    : DEFAULT_JUMP_MULTIPLIER
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  try {
    snapshot = parse(localStorage.getItem(JUMP_MULTIPLIER_STORAGE_KEY))
  } catch {
    snapshot = DEFAULT_JUMP_MULTIPLIER
  }
}

export function getJumpMultiplierSnapshot(): JumpMultiplier {
  ensureInitialized()
  return snapshot
}

export function getServerJumpMultiplierSnapshot(): JumpMultiplier {
  return DEFAULT_JUMP_MULTIPLIER
}

export function subscribeToJumpMultiplier(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeJumpMultiplier(value: JumpMultiplier): void {
  initialized = true
  snapshot = value

  try {
    if (value === DEFAULT_JUMP_MULTIPLIER) {
      localStorage.removeItem(JUMP_MULTIPLIER_STORAGE_KEY)
    } else {
      localStorage.setItem(JUMP_MULTIPLIER_STORAGE_KEY, String(value))
    }
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
