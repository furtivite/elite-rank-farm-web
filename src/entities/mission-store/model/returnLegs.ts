'use client'

import { RETURN_LEGS_STORAGE_KEY } from '@/shared/config/storageKeys'
import { createDemoCopy } from '@/shared/lib/demoSandbox'

export type ReturnLeg = {
  systemName: string
  stationName: string
  extraRun?: boolean
}

const EMPTY: Readonly<Record<string, ReturnLeg>> = {}

let snapshot: Readonly<Record<string, ReturnLeg>> = EMPTY
let initialized = false
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

const demo = createDemoCopy<Readonly<Record<string, ReturnLeg>>>(emit)

export function returnLegKey(systemName: string, stationName: string): string {
  return `${systemName}|${stationName}`
}

function parse(value: unknown): Readonly<Record<string, ReturnLeg>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return EMPTY
  }

  const result: Record<string, ReturnLeg> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const record = item as Record<string, unknown>
    if (
      typeof record.systemName !== 'string' ||
      typeof record.stationName !== 'string' ||
      record.systemName === '' ||
      record.stationName === ''
    ) {
      continue
    }

    result[key] = {
      systemName: record.systemName,
      stationName: record.stationName,
      extraRun: record.extraRun === true ? true : undefined,
    }
  }

  return result
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true

  try {
    const raw = localStorage.getItem(RETURN_LEGS_STORAGE_KEY)
    snapshot = raw === null ? EMPTY : parse(JSON.parse(raw))
  } catch {
    snapshot = EMPTY
  }
}

export function getReturnLegsSnapshot(): Readonly<Record<string, ReturnLeg>> {
  ensureInitialized()
  return demo.read(snapshot)
}

export function getServerReturnLegsSnapshot(): Readonly<Record<string, ReturnLeg>> {
  return EMPTY
}

export function subscribeToReturnLegs(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeReturnLegs(next: Readonly<Record<string, ReturnLeg>>): void {
  if (demo.write(next)) {
    return
  }
  ensureInitialized()
  snapshot = next

  try {
    localStorage.setItem(RETURN_LEGS_STORAGE_KEY, JSON.stringify(next))
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}
