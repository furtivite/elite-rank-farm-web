import { useCallback, useSyncExternalStore } from 'react'
import { getManualMissionSettings } from '@/entities/mission-store/model/manualSettings'
import {
  getReturnRemindersSnapshot,
  getServerReturnRemindersSnapshot,
  subscribeToReturnReminders,
  writeReturnReminders,
} from '@/entities/mission-store/model/returnReminders'
import {
  getMissionsSnapshot,
  getServerMissionsSnapshot,
  subscribeToMissions,
  writeMissions,
} from '@/entities/mission-store/model/store'
import {
  MISSION_LIMIT,
  MISSION_NOTE_MAX,
  type MissionAddResult,
  type ReturnReminder,
  type MissionTarget,
  type StoredMission,
} from '@/entities/mission-store/model/types'

export type UseMissionStoreResult = {
  missions: StoredMission[]
  usedSlots: number
  completedCount: number
  isFull: boolean
  addMission: (target: MissionTarget) => MissionAddResult
  removeMission: (id: string) => void
  returnReminders: readonly ReturnReminder[]
  dismissReturnReminder: (id: string) => void
  addReturnReminders: (next: readonly ReturnReminder[]) => void
  setCompleted: (id: string, completed: boolean) => void
  removeCompletedAtStation: (systemName: string, stationName: string) => void
  removeCompletedInSystem: (systemName: string) => void
  removeSystem: (systemName: string) => void
  removeStation: (systemName: string, stationName: string) => void
  clearCompleted: () => void
  clearAll: () => void
  replaceAll: (missions: readonly StoredMission[]) => void
}

function newMissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function useMissionStore(): UseMissionStoreResult {
  const missions = useSyncExternalStore(
    subscribeToMissions,
    getMissionsSnapshot,
    getServerMissionsSnapshot,
  )

  const addMission = useCallback((target: MissionTarget): MissionAddResult => {
    const current = getMissionsSnapshot()
    if (current.length >= MISSION_LIMIT && !getManualMissionSettings().excludeFromCount) {
      return 'limit-reached'
    }

    writeMissions([
      ...current,
      {
        id: newMissionId(),
        targetSystem: target.targetSystem,
        targetSystemId: target.targetSystemId,
        targetBody: target.targetBody,
        targetStation: target.targetStation,
        targetStationId: target.targetStationId,
        ...(target.note !== undefined && target.note.trim() !== ''
          ? { note: target.note.trim().slice(0, MISSION_NOTE_MAX) }
          : {}),
        addedAt: new Date().toISOString(),
      },
    ])

    return 'added'
  }, [])

  const addReturnReminders = useCallback((next: readonly ReturnReminder[]) => {
    writeReturnReminders([...next])
  }, [])

  const dismissReturnReminder = useCallback((id: string) => {
    writeReturnReminders(getReturnRemindersSnapshot().filter((item) => item.id !== id))
  }, [])

  const returnReminders = useSyncExternalStore(
    subscribeToReturnReminders,
    getReturnRemindersSnapshot,
    getServerReturnRemindersSnapshot,
  )

  const removeMission = useCallback((id: string) => {
    writeMissions(getMissionsSnapshot().filter((mission) => mission.id !== id))
  }, [])

  const setCompleted = useCallback((id: string, completed: boolean) => {
    writeMissions(
      getMissionsSnapshot().map((mission) =>
        mission.id === id ? { ...mission, completed: completed ? true : undefined } : mission,
      ),
    )
  }, [])

  const removeCompletedAtStation = useCallback((systemName: string, stationName: string) => {
    const gone = (mission: StoredMission) =>
      mission.completed === true &&
      mission.targetSystem === systemName &&
      mission.targetStation === stationName

    writeMissions(getMissionsSnapshot().filter((mission) => !gone(mission)))
  }, [])

  const removeCompletedInSystem = useCallback((systemName: string) => {
    const gone = (mission: StoredMission) =>
      mission.completed === true && mission.targetSystem === systemName

    writeMissions(getMissionsSnapshot().filter((mission) => !gone(mission)))
  }, [])

  const removeSystem = useCallback((systemName: string) => {
    writeMissions(getMissionsSnapshot().filter((mission) => mission.targetSystem !== systemName))
  }, [])

  const removeStation = useCallback((systemName: string, stationName: string) => {
    const gone = (mission: StoredMission) =>
      mission.targetSystem === systemName && mission.targetStation === stationName

    writeMissions(getMissionsSnapshot().filter((mission) => !gone(mission)))
  }, [])

  const clearCompleted = useCallback(() => {
    writeMissions(getMissionsSnapshot().filter((mission) => mission.completed !== true))
  }, [])

  const clearAll = useCallback(() => {
    writeMissions([])
    writeReturnReminders([])
  }, [])

  const replaceAll = useCallback((next: readonly StoredMission[]) => {
    writeMissions(next.slice(0, MISSION_LIMIT).map((mission) => ({ ...mission })))
  }, [])

  const completedCount = missions.filter((mission) => mission.completed === true).length

  return {
    missions,
    usedSlots: missions.length,
    completedCount,
    isFull: missions.length >= MISSION_LIMIT,
    addMission,
    removeMission,
    returnReminders,
    dismissReturnReminder,
    addReturnReminders,
    setCompleted,
    removeCompletedAtStation,
    removeCompletedInSystem,
    removeSystem,
    removeStation,
    clearCompleted,
    clearAll,
    replaceAll,
  }
}
