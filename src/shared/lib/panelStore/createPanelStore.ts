export type PanelStore = {
  getSnapshot: () => boolean
  getServerSnapshot: () => boolean
  subscribe: (listener: () => void) => () => void
  setVisible: (isVisible: boolean) => void
}

export function createPanelStore(storageKey: string, visibleByDefault: boolean): PanelStore {
  let snapshot = visibleByDefault
  let initialized = false
  const listeners = new Set<() => void>()

  const getSnapshot = (): boolean => {
    if (!initialized && typeof window !== 'undefined') {
      initialized = true

      try {
        const stored = localStorage.getItem(storageKey)
        if (stored !== null) {
          snapshot = stored !== 'hidden'
        }
      } catch {}
    }

    return snapshot
  }

  return {
    getSnapshot,
    getServerSnapshot: () => visibleByDefault,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setVisible(isVisible) {
      getSnapshot()
      snapshot = isVisible

      try {
        if (isVisible === visibleByDefault) {
          localStorage.removeItem(storageKey)
        } else {
          localStorage.setItem(storageKey, isVisible ? 'shown' : 'hidden')
        }
      } catch {}

      for (const listener of listeners) {
        listener()
      }
    },
  }
}
