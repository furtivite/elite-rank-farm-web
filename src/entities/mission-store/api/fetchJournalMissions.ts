import { withBasePath } from '@/shared/config/basePath'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'
import { parseJournalMissions } from '@/entities/mission-store/model/journalTypes'

const MISSIONS_URL = withBasePath('/api/elite/missions')

export type FetchJournalMissionsResult =
  { status: 'success'; missions: JournalMission[] } | { status: 'unavailable' }

export async function fetchJournalMissions(): Promise<FetchJournalMissionsResult> {
  let response: Response
  try {
    response = await fetch(MISSIONS_URL, { credentials: 'include', cache: 'no-store' })
  } catch {
    return { status: 'unavailable' }
  }

  if (!response.ok) {
    return { status: 'unavailable' }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { status: 'unavailable' }
  }

  const missions = parseJournalMissions(payload)

  return missions === null ? { status: 'unavailable' } : { status: 'success', missions }
}
