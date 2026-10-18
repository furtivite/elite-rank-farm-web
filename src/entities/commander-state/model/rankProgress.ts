export type RankProgressPair = {
  rank: number
  progress: number
}

export type ProgressTracker = {
  seen: RankProgressPair
  stale: boolean
}

export function trackProgress(
  tracker: ProgressTracker | null,
  current: RankProgressPair,
): ProgressTracker {
  if (tracker === null) {
    return { seen: current, stale: false }
  }

  const progressUnchanged = current.progress === tracker.seen.progress

  if (current.rank > tracker.seen.rank) {
    return { seen: current, stale: progressUnchanged }
  }

  if (current.rank === tracker.seen.rank) {
    return { seen: current, stale: tracker.stale && progressUnchanged }
  }

  return { seen: current, stale: false }
}

export function isProgressStale(tracker: ProgressTracker | null): boolean {
  return tracker !== null && tracker.stale
}

export function displayedProgress(tracker: ProgressTracker | null): number {
  if (tracker === null) {
    return 0
  }

  return tracker.stale ? 0 : tracker.seen.progress
}
