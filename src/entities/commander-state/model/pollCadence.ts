let failureCount = 0

const MAX_BACKOFF_STEPS = 3
let unchangedCount = 0

const UNCHANGED_BEFORE_BACKOFF = 6

export const PRESENCE_STALE_AFTER_MS = 60 * 60 * 1000

const STALE_POLL_EVERY = 12

const MAX_UNCHANGED_STEPS = 2

let lastUpdatedAtMs: number | null = null

let lastObservedAt: string | null = null

export function noteObservedAt(observedAt: string): void {
  if (observedAt === lastObservedAt) {
    unchangedCount += 1
    return
  }

  lastObservedAt = observedAt
  unchangedCount = 0
}

export function isStateFresh(now: number = Date.now()): boolean {
  return lastUpdatedAtMs !== null && now - lastUpdatedAtMs < PRESENCE_STALE_AFTER_MS
}

export function noteUpdatedAt(updatedAt: string): void {
  const parsed = Date.parse(updatedAt)
  lastUpdatedAtMs = Number.isNaN(parsed) ? null : parsed
}

export function shouldSkipPoll(tick: number, now: number = Date.now()): boolean {
  if (
    failureCount === 0 &&
    lastUpdatedAtMs !== null &&
    now - lastUpdatedAtMs >= PRESENCE_STALE_AFTER_MS
  ) {
    return tick % STALE_POLL_EVERY !== 0
  }

  if (failureCount === 0) {
    if (unchangedCount < UNCHANGED_BEFORE_BACKOFF) {
      return false
    }

    const steps = Math.min(
      Math.floor(unchangedCount / UNCHANGED_BEFORE_BACKOFF),
      MAX_UNCHANGED_STEPS,
    )

    return tick % 2 ** steps !== 0
  }

  const every = 2 ** Math.min(failureCount, MAX_BACKOFF_STEPS)

  return tick % every !== 0
}

export function noteFailure(): void {
  failureCount += 1
}

export function noteSuccess(): void {
  failureCount = 0
}

export function resetPollCadence(): void {
  failureCount = 0
  unchangedCount = 0
  lastObservedAt = null
  lastUpdatedAtMs = null
}
