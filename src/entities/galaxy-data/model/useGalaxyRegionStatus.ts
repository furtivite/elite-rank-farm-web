import { currentTranslate } from '@/shared/lib/i18n'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getRegionMeta } from '@/entities/galaxy-data/api/galaxyDataProvider'
import type { RegionCliKey, RegionMeta } from '@/entities/galaxy-data/model/types'

export type GalaxyRegionStatusState = {
  status: 'idle' | 'loading' | 'success' | 'error'
  meta: RegionMeta | null
  errorMessage: string | null
}

export type UseGalaxyRegionStatusResult = GalaxyRegionStatusState & {
  refresh: () => Promise<void>
}

function errorMessageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return currentTranslate()('region.failed')
}

export function useGalaxyRegionStatus(regionKey: RegionCliKey): UseGalaxyRegionStatusResult {
  const [state, setState] = useState<GalaxyRegionStatusState>({
    status: 'loading',
    meta: null,
    errorMessage: null,
  })
  const inFlightRef = useRef(false)

  const load = useCallback(
    async (announce: boolean) => {
      if (inFlightRef.current) {
        return
      }

      inFlightRef.current = true
      if (announce) {
        setState((prev) => ({ ...prev, status: 'loading', errorMessage: null }))
      }

      try {
        const meta = await getRegionMeta(regionKey)
        setState({ status: 'success', meta, errorMessage: null })
      } catch (error) {
        setState((prev) => ({
          status: 'error',
          meta: prev.meta,
          errorMessage: errorMessageFromUnknown(error),
        }))
      } finally {
        inFlightRef.current = false
      }
    },
    [regionKey],
  )

  const refresh = useCallback(() => load(true), [load])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load(false)
  }, [load])

  return { ...state, refresh }
}
