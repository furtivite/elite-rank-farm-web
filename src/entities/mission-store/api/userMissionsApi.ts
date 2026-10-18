import { withBasePath } from '@/shared/config/basePath'
import { parseMissionList } from '@/entities/mission-store/model/validate'
import type { StoredMission } from '@/entities/mission-store/model/types'

export type FetchUserMissionsResult =
  { status: 'success'; missions: StoredMission[] } | { status: 'guest' } | { status: 'unavailable' }

const URL = withBasePath('/api/account/missions')

function parse(payload: unknown): StoredMission[] {
  if (typeof payload !== 'object' || payload === null) {
    return []
  }

  return parseMissionList((payload as { missions?: unknown }).missions)
}

export async function fetchUserMissions(): Promise<FetchUserMissionsResult> {
  let response: Response
  try {
    response = await fetch(URL, { credentials: 'include', cache: 'no-store' })
  } catch {
    return { status: 'unavailable' }
  }

  if (response.status === 401) {
    return { status: 'guest' }
  }
  if (!response.ok) {
    return { status: 'unavailable' }
  }

  try {
    return { status: 'success', missions: parse(await response.json()) }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function saveUserMissions(
  missions: readonly StoredMission[],
): Promise<StoredMission[] | null> {
  try {
    const response = await fetch(URL, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missions }),
    })

    return response.ok ? parse(await response.json()) : null
  } catch {
    return null
  }
}

export async function forgetUserMissions(
  missionIds: readonly string[],
): Promise<StoredMission[] | null> {
  try {
    const response = await fetch(URL, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionIds }),
    })

    return response.ok ? parse(await response.json()) : null
  } catch {
    return null
  }
}
