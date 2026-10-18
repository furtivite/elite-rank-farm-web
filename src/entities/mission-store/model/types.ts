export type StoredMission = {
  id: string
  targetSystem: string
  targetSystemId?: string
  targetBody?: string
  targetStation: string
  targetStationId?: string
  note?: string
  completed?: boolean
  awaitingCargo?: boolean
  addedAt: string
}

export type MissionTarget = {
  note?: string
  targetSystem: string
  targetSystemId?: string
  targetBody?: string
  targetStation: string
  targetStationId?: string
}

export const MISSION_NOTE_MAX = 120

export const MISSION_LIMIT = 20

export const MISSION_WARN_FROM = 18

export type MissionAddResult = 'added' | 'limit-reached'

export type ReturnReminder = {
  id: string
  systemName: string
  stationName: string
  fromStation?: string
  createdAt: string
}
