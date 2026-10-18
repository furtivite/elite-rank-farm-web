import { refreshSystem, type CachedSystem } from '@/entities/galaxy-data'

const GAP_MS = 1100

const FRESH_FOR_MS = 5 * 60 * 1000

const refreshedAt = new Map<string, number>()

export type RefreshTargetsOptions = {
  cancelled: () => boolean
  onFresh: (system: CachedSystem) => void
  wait?: (ms: number) => Promise<void>
  now?: () => number
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export async function refreshTargets(
  systemIds: readonly string[],
  options: RefreshTargetsOptions,
): Promise<void> {
  const { cancelled, onFresh } = options
  const wait = options.wait ?? sleep
  const now = options.now ?? Date.now

  const stale = systemIds.filter((id) => {
    const last = refreshedAt.get(id)
    return last === undefined || now() - last >= FRESH_FOR_MS
  })

  for (const [index, systemId] of stale.entries()) {
    if (cancelled()) {
      return
    }

    if (index > 0) {
      await wait(GAP_MS)
      if (cancelled()) {
        return
      }
    }

    const result = await refreshSystem(systemId)

    if (result.status === 'success') {
      refreshedAt.set(systemId, now())
      if (!cancelled()) {
        onFresh(result.system)
      }
      continue
    }

    if (result.status === 'unauthorized') {
      return
    }
  }
}

export function _resetRefreshedTargetsForTests(): void {
  refreshedAt.clear()
}
