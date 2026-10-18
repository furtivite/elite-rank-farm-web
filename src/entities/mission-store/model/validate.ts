import type { StoredMission } from '@/entities/mission-store/model/types'

const MISSION_STORE_VERSION = 1

function parseMission(value: unknown): StoredMission | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const record = value as Record<string, unknown>

  const id = record.id
  const targetSystem = record.targetSystem
  const targetStation = record.targetStation
  const addedAt = record.addedAt

  if (typeof id !== 'string' || id === '') {
    return null
  }
  if (typeof targetSystem !== 'string' || targetSystem === '') {
    return null
  }
  if (typeof targetStation !== 'string' || targetStation === '') {
    return null
  }
  if (typeof addedAt !== 'string' || addedAt === '') {
    return null
  }

  const optionalString = (key: string): string | undefined => {
    const raw = record[key]
    return typeof raw === 'string' && raw !== '' ? raw : undefined
  }

  return {
    id,
    targetSystem,
    targetSystemId: optionalString('targetSystemId'),
    targetBody: optionalString('targetBody'),
    targetStation,
    targetStationId: optionalString('targetStationId'),
    completed: record.completed === true ? true : undefined,
    addedAt,
  }
}

export function parseMissionList(value: unknown): StoredMission[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: StoredMission[] = []
  const seenIds = new Set<string>()

  for (const entry of value) {
    const mission = parseMission(entry)
    if (mission !== null && !seenIds.has(mission.id)) {
      seenIds.add(mission.id)
      result.push(mission)
    }
  }

  return result
}

export function parseStoredMissions(value: unknown): StoredMission[] {
  if (typeof value !== 'object' || value === null) {
    return []
  }
  const record = value as Record<string, unknown>

  if (record.version !== MISSION_STORE_VERSION) {
    return []
  }

  return parseMissionList(record.missions)
}

export function serializeMissions(missions: readonly StoredMission[]): string {
  return JSON.stringify({ version: MISSION_STORE_VERSION, missions })
}

export function serializeMissionsForExport(missions: readonly StoredMission[]): string {
  return JSON.stringify({ version: MISSION_STORE_VERSION, missions }, null, 2)
}
