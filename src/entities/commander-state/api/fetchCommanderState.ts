import { currentTranslate } from '@/shared/lib/i18n'
import { parseCommanderStateResponse } from '@/entities/commander-state/model/validate'
import { withBasePath } from '@/shared/config/basePath'
import type {
  CommanderStateResponse,
  CommanderStateStatus,
} from '@/entities/commander-state/model/types'

const STATE_URL = withBasePath('/api/elite/state')

export type FetchCommanderStateResult =
  | { status: Extract<CommanderStateStatus, 'success'>; data: CommanderStateResponse }
  | {
      status: Exclude<CommanderStateStatus, 'success' | 'guest' | 'loading'>
      message: string
      agentUpdateRequired?: boolean
    }

export async function fetchCommanderState(): Promise<FetchCommanderStateResult> {
  const t = currentTranslate()
  let response: Response
  try {
    response = await fetch(STATE_URL, {
      credentials: 'include',
      cache: 'no-store',
    })
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : t('error.requestFailed'),
    }
  }

  if (response.status === 404) {
    let rejected = false
    try {
      const body: unknown = await response.json()
      rejected =
        typeof body === 'object' &&
        body !== null &&
        (body as { agentUpdateRequired?: unknown }).agentUpdateRequired === true
    } catch {
      rejected = false
    }

    return {
      status: 'not-found',
      message: rejected ? t('error.agentTooOld') : t('error.noCommanderState'),
      agentUpdateRequired: rejected,
    }
  }
  if (response.status === 401 || response.status === 403) {
    return { status: 'unauthorized', message: t('error.signInForCommanderState') }
  }
  if (response.status === 429) {
    return { status: 'error', message: t('error.tooOften') }
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

  const parsed = parseCommanderStateResponse(payload)
  if (parsed === null) {
    return { status: 'error', message: t('error.badContract') }
  }

  return { status: 'success', data: parsed }
}
