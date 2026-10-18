import { useEffect } from 'react'
import { usePinnedTarget } from '@/features/next-destination/model/usePinnedTarget'

export function useDropPinWhenGone(systemKeys: readonly string[], basketIsKnown: boolean): void {
  const { pinned, unpin } = usePinnedTarget()
  const isGone = basketIsKnown && pinned !== null && !systemKeys.includes(pinned.systemKey)

  useEffect(() => {
    if (isGone) {
      unpin()
    }
  }, [isGone, unpin])
}
