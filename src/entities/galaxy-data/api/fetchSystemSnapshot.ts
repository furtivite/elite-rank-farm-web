import { currentTranslate } from '@/shared/lib/i18n'
import { parseCachedSystem } from '@/entities/galaxy-data/model/validateSystem'
import type { CachedSystem } from '@/entities/galaxy-data/model/types'
import { withBasePath } from '@/shared/config/basePath'

const SYSTEM_URL = withBasePath('/api/galaxy/system')

export type FetchSystemSnapshotResult =
  | { status: 'success'; system: CachedSystem }
  | { status: 'unauthorized' | 'not-found' | 'error'; message: string }

export async function fetchSystemSnapshot(systemId: string): Promise<FetchSystemSnapshotResult> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(`${SYSTEM_URL}?id=${encodeURIComponent(systemId)}`, {
      credentials: 'include',
      cache: 'no-store',
    })
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : t('error.requestFailed'),
    }
  }

  if (response.status === 401 || response.status === 403) {
    return {
      status: 'unauthorized',
      message: t('error.signInToRefreshSystems'),
    }
  }
  if (response.status === 404) {
    return { status: 'not-found', message: t('error.unknownSystem') }
  }
  if (!response.ok) {
    return { status: 'error', message: t('error.serverReturned', { status: response.status }) }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { status: 'error', message: t('error.badResponse') }
  }

  const system =
    typeof payload === 'object' && payload !== null && 'system' in payload
      ? parseCachedSystem((payload as { system: unknown }).system)
      : null

  if (system === null) {
    return { status: 'error', message: t('error.badFormat') }
  }

  if (system.id !== systemId) {
    return { status: 'error', message: t('error.wrongSystem') }
  }

  return { status: 'success', system }
}
