import { useCallback, useSyncExternalStore } from 'react'
import {
  getPinSnapshot,
  getServerPinSnapshot,
  subscribeToPin,
  writePin,
} from '@/features/next-destination/model/pinStore'
import type { PinnedTarget } from '@/features/next-destination/lib/pickNextDestination'

export type UsePinnedTargetResult = {
  pinned: PinnedTarget | null
  pin: (target: PinnedTarget) => void
  unpin: () => void
}

export function usePinnedTarget(): UsePinnedTargetResult {
  const pinned = useSyncExternalStore(subscribeToPin, getPinSnapshot, getServerPinSnapshot)

  const pin = useCallback((target: PinnedTarget) => writePin(target), [])
  const unpin = useCallback(() => writePin(null), [])

  return { pinned, pin, unpin }
}
