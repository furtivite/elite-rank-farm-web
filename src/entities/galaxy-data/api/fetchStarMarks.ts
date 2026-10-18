import { withBasePath } from '@/shared/config/basePath'

export type StarMark = {
  stationId: string
  stationName: string | null
  systemName: string | null
  bodyName: string | null
  distanceToArrivalLs: number | null
  markedBy: string | null
  markedAt: string | null
  fromDump: boolean
  dumpStarName: string | null
}

export type FetchStarMarksResult =
  { status: 'success'; marks: StarMark[] } | { status: 'unauthorized' } | { status: 'error' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

export async function fetchStarMarks(): Promise<FetchStarMarksResult> {
  let response: Response
  try {
    response = await fetch(withBasePath('/api/galaxy/station-star'), {
      credentials: 'include',
      cache: 'no-store',
    })
  } catch {
    return { status: 'error' }
  }

  if (response.status === 401) {
    return { status: 'unauthorized' }
  }
  if (!response.ok) {
    return { status: 'error' }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { status: 'error' }
  }

  if (!isRecord(payload) || !Array.isArray(payload.marks)) {
    return { status: 'error' }
  }

  const marks: StarMark[] = []
  for (const entry of payload.marks) {
    if (!isRecord(entry) || typeof entry.stationId !== 'string') {
      continue
    }

    marks.push({
      stationId: entry.stationId,
      stationName: nullableString(entry.stationName),
      systemName: nullableString(entry.systemName),
      bodyName: nullableString(entry.bodyName),
      distanceToArrivalLs:
        typeof entry.distanceToArrivalLs === 'number' && Number.isFinite(entry.distanceToArrivalLs)
          ? entry.distanceToArrivalLs
          : null,
      markedBy: nullableString(entry.markedBy),
      markedAt: nullableString(entry.markedAt),
      fromDump: entry.fromDump === true,
      dumpStarName: nullableString(entry.dumpStarName),
    })
  }

  return { status: 'success', marks }
}
