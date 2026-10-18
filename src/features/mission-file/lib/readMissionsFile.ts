import { parseStoredMissions, type StoredMission } from '@/entities/mission-store'

export type ReadMissionsResult =
  { status: 'ok'; missions: StoredMission[] } | { status: 'empty' } | { status: 'invalid' }

export async function readMissionsFile(file: {
  text: () => Promise<string>
}): Promise<ReadMissionsResult> {
  let missions: StoredMission[]
  try {
    missions = parseStoredMissions(JSON.parse(await file.text()))
  } catch {
    return { status: 'invalid' }
  }

  return missions.length === 0 ? { status: 'empty' } : { status: 'ok', missions }
}
