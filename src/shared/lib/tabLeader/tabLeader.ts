'use client'

import { TAB_LEADER_STORAGE_KEY } from '@/shared/config/storageKeys'

export type LeaderClaim = {
  id: string
  at: number
}

export const LEADER_STALE_MS = 30_000

export function shouldClaim(claim: LeaderClaim | null, tabId: string, now: number): boolean {
  if (claim === null) {
    return true
  }

  if (claim.id === tabId) {
    return true
  }

  return now - claim.at >= LEADER_STALE_MS
}

function readClaim(): LeaderClaim | null {
  try {
    const raw = localStorage.getItem(TAB_LEADER_STORAGE_KEY)
    if (raw === null) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as LeaderClaim).id !== 'string' ||
      typeof (parsed as LeaderClaim).at !== 'number'
    ) {
      return null
    }

    return parsed as LeaderClaim
  } catch {
    return null
  }
}

const tabId = Math.random().toString(36).slice(2)

export function claimPollingRole(now: number = Date.now()): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const claim = readClaim()
  if (!shouldClaim(claim, tabId, now)) {
    return false
  }

  try {
    localStorage.setItem(TAB_LEADER_STORAGE_KEY, JSON.stringify({ id: tabId, at: now }))
  } catch {
    return true
  }

  return true
}

export function releasePollingRole(): void {
  const claim = readClaim()
  if (claim?.id !== tabId) {
    return
  }

  try {
    localStorage.removeItem(TAB_LEADER_STORAGE_KEY)
  } catch {}
}
