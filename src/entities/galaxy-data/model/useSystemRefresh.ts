'use client'

import { useState } from 'react'
import { refreshSystem } from '@/entities/galaxy-data/api/galaxyDataProvider'

export type SystemRefreshState = {
  pendingSystemId: string | null
  errorSystemId: string | null
  errorMessage: string | null
}

export type UseSystemRefreshResult = SystemRefreshState & {
  refresh: (systemId: string) => Promise<void>
}

export function useSystemRefresh(onRefreshed: () => void): UseSystemRefreshResult {
  const [state, setState] = useState<SystemRefreshState>({
    pendingSystemId: null,
    errorSystemId: null,
    errorMessage: null,
  })

  const refresh = async (systemId: string): Promise<void> => {
    setState({ pendingSystemId: systemId, errorSystemId: null, errorMessage: null })

    const result = await refreshSystem(systemId)

    setState((previous) => {
      if (previous.pendingSystemId !== systemId) {
        return previous
      }

      return result.status === 'success'
        ? { pendingSystemId: null, errorSystemId: null, errorMessage: null }
        : { pendingSystemId: null, errorSystemId: systemId, errorMessage: result.message }
    })

    if (result.status === 'success') {
      onRefreshed()
    }
  }

  return { ...state, refresh }
}
