let active = false
const listeners = new Set<() => void>()

export function isDemoSandboxActive(): boolean {
  return active
}

export function getServerDemoSandboxActive(): boolean {
  return false
}

export function setDemoSandboxActive(next: boolean): void {
  if (next === active) {
    return
  }
  active = next
  for (const listener of [...listeners]) {
    listener()
  }
}

export function subscribeToDemoSandbox(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export type DemoCopy<T> = {
  read: (real: T) => T
  write: (next: T) => boolean
  reset: () => void
}

export function createDemoCopy<T>(onChange: () => void): DemoCopy<T> {
  let copy: { value: T } | null = null

  subscribeToDemoSandbox(() => {
    copy = null
    onChange()
  })

  return {
    read: (real) => {
      if (!active) {
        return real
      }
      copy ??= { value: real }
      return copy.value
    },
    write: (next) => {
      if (!active) {
        return false
      }
      copy = { value: next }
      onChange()
      return true
    },
    reset: () => {
      copy = null
    },
  }
}

export function _resetDemoSandboxForTests(): void {
  active = false
}
