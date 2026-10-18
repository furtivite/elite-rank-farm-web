'use client'

import {
  fetchUserMissions,
  forgetUserMissions,
  getMissionsSnapshot,
  mergeMissions,
  saveUserMissions,
  subscribeToForgottenMissions,
  subscribeToMissions,
  writeMissions,
  type StoredMission,
} from '@/entities/mission-store'
import { useAccountSync } from '@/shared/lib/accountSync'

export function useMissionStoreSync(isSignedIn: boolean): void {
  useAccountSync<StoredMission[]>(isSignedIn, {
    fetchRemote: async () => {
      const result = await fetchUserMissions()

      return result.status === 'success'
        ? { status: 'success', items: result.missions }
        : { status: result.status }
    },
    saveRemote: saveUserMissions,
    forgetRemote: forgetUserMissions,
    readLocal: getMissionsSnapshot,
    writeLocal: writeMissions,
    subscribeLocal: subscribeToMissions,
    subscribeForgotten: subscribeToForgottenMissions,
    merge: mergeMissions,
    same: sameMissions,
  })
}

function sameMissions(left: readonly StoredMission[], right: readonly StoredMission[]): boolean {
  if (left.length !== right.length) {
    return false
  }

  const byId = new Map(right.map((mission) => [mission.id, mission]))

  return left.every((mission) => {
    const other = byId.get(mission.id)

    return (
      other !== undefined &&
      other.targetSystem === mission.targetSystem &&
      other.targetSystemId === mission.targetSystemId &&
      other.targetBody === mission.targetBody &&
      other.targetStation === mission.targetStation &&
      other.targetStationId === mission.targetStationId &&
      other.note === mission.note &&
      other.completed === mission.completed &&
      other.addedAt === mission.addedAt
    )
  })
}
