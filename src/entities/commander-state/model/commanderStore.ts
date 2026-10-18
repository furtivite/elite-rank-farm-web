import { fetchCommanderState } from '@/entities/commander-state/api/fetchCommanderState'
import { rememberCommander } from '@/shared/lib/lastCommander'
import {
  displayedProgress,
  isProgressStale,
  trackProgress,
  type ProgressTracker,
} from '@/entities/commander-state/model/rankProgress'
import type {
  CommanderStateResponse,
  CommanderStateStatus,
} from '@/entities/commander-state/model/types'
import {
  isStateFresh,
  noteFailure,
  noteObservedAt,
  noteSuccess,
  noteUpdatedAt,
  resetPollCadence,
} from '@/entities/commander-state/model/pollCadence'

export {
  shouldSkipPoll,
  PRESENCE_STALE_AFTER_MS,
} from '@/entities/commander-state/model/pollCadence'

export function isDockedNow(now: number = Date.now()): boolean {
  return snapshot.data !== null && snapshot.data.state.currentStation !== null && isStateFresh(now)
}

export type NavyProgressValue = {
  percent: number
  at: string | null
}

export type NavyProgress = {
  imperial: NavyProgressValue
  federal: NavyProgressValue
}

export type CommanderStoreState = {
  status: CommanderStateStatus
  data: CommanderStateResponse | null
  progress: NavyProgress | null
  errorMessage: string | null
  agentUpdateRequired: boolean
}

const EMPTY: CommanderStoreState = {
  status: 'guest',
  data: null,
  progress: null,
  errorMessage: null,
  agentUpdateRequired: false,
}

let snapshot: CommanderStoreState = EMPTY

let trackers: { imperial: ProgressTracker | null; federal: ProgressTracker | null } = {
  imperial: null,
  federal: null,
}

const listeners = new Set<() => void>()

let inFlight: Promise<void> | null = null

function emit(): void {
  for (const listener of listeners) {
    listener()
  }
}

function setState(next: Partial<CommanderStoreState>): void {
  snapshot = { ...snapshot, ...next }
  emit()
}

export function getCommanderSnapshot(): CommanderStoreState {
  return snapshot
}

export function getServerCommanderSnapshot(): CommanderStoreState {
  return EMPTY
}

export function subscribeToCommander(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function navyProgress(tracker: ProgressTracker | null, progressAt: string): NavyProgressValue {
  return isProgressStale(tracker)
    ? { percent: 0, at: null }
    : { percent: displayedProgress(tracker), at: progressAt }
}

export function loadCommanderState(silent = false): Promise<void> {
  inFlight ??= runLoad(silent).finally(() => {
    inFlight = null
  })

  return inFlight
}

async function runLoad(silent: boolean): Promise<void> {
  if (!silent) {
    setState({ status: 'loading' })
  }

  const result = await fetchCommanderState()

  if (result.status === 'success') {
    const state = result.data.state
    trackers = {
      imperial: trackProgress(trackers.imperial, {
        rank: state.imperialRank,
        progress: state.imperialProgress,
      }),
      federal: trackProgress(trackers.federal, {
        rank: state.federalRank,
        progress: state.federalProgress,
      }),
    }

    const previous = snapshot.data
    if (
      snapshot.status === 'success' &&
      previous !== null &&
      previous.state.observedAt === state.observedAt &&
      previous.updatedAt === result.data.updatedAt &&
      snapshot.agentUpdateRequired === false &&
      snapshot.errorMessage === null
    ) {
      noteSuccess()
      noteObservedAt(state.observedAt)
      noteUpdatedAt(result.data.updatedAt)
      return
    }

    setState({
      status: 'success',
      agentUpdateRequired: false,
      data: result.data,
      progress: {
        imperial: navyProgress(trackers.imperial, state.imperialProgressAt),
        federal: navyProgress(trackers.federal, state.federalProgressAt),
      },
      errorMessage: null,
    })
    rememberCommander(state.commanderName)
    noteSuccess()
    noteObservedAt(state.observedAt)
    noteUpdatedAt(result.data.updatedAt)
    return
  }

  noteFailure()

  setState({
    status: result.status,
    errorMessage: result.message,
    agentUpdateRequired: result.agentUpdateRequired === true,
  })
}

export function applyStateFromLeader(response: CommanderStateResponse | null): void {
  if (response === null) {
    setState({ status: 'not-found', data: null, progress: null })
    return
  }

  const state = response.state
  trackers = {
    imperial: trackProgress(trackers.imperial, {
      rank: state.imperialRank,
      progress: state.imperialProgress,
    }),
    federal: trackProgress(trackers.federal, {
      rank: state.federalRank,
      progress: state.federalProgress,
    }),
  }

  setState({
    status: 'success',
    agentUpdateRequired: response.agentUpdateRequired === true,
    data: response,
    progress: {
      imperial: navyProgress(trackers.imperial, state.imperialProgressAt),
      federal: navyProgress(trackers.federal, state.federalProgressAt),
    },
    errorMessage: null,
  })
  rememberCommander(state.commanderName)

  noteObservedAt(state.observedAt)
  noteUpdatedAt(response.updatedAt)
}

export function resetCommanderState(): void {
  trackers = { imperial: null, federal: null }
  resetPollCadence()
  snapshot = EMPTY
  emit()
}
