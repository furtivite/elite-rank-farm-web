'use client'

export const PAGE_SIZES = [10, 25, 50, 100] as const

export type PageSize = (typeof PAGE_SIZES)[number]

export type PageSizeStore<T extends PageSize> = {
  getSnapshot: () => T
  getServerSnapshot: () => T
  subscribe: (listener: () => void) => () => void
  write: (size: T) => void
}

export function createPageSizeStore<T extends PageSize>(
  storageKey: string,
  defaultSize: T,
  allowed: readonly T[] = PAGE_SIZES as readonly PageSize[] as readonly T[],
): PageSizeStore<T> {
  let snapshot: T = defaultSize
  let initialized = false
  const listeners = new Set<() => void>()

  const parse = (raw: string | null): T => {
    const value = Number(raw)
    return (allowed as readonly number[]).includes(value) ? (value as T) : defaultSize
  }

  const ensureInitialized = (): void => {
    if (initialized || typeof window === 'undefined') {
      return
    }
    initialized = true
    try {
      snapshot = parse(localStorage.getItem(storageKey))
    } catch {
      snapshot = defaultSize
    }
  }

  return {
    getSnapshot: () => {
      ensureInitialized()
      return snapshot
    },
    getServerSnapshot: () => defaultSize,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    write: (size) => {
      initialized = true
      snapshot = size

      try {
        if (size === defaultSize) {
          localStorage.removeItem(storageKey)
        } else {
          localStorage.setItem(storageKey, String(size))
        }
      } catch {}

      for (const listener of listeners) {
        listener()
      }
    },
  }
}
