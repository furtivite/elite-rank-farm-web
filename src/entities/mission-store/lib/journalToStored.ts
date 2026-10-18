import { awaitsCargo } from '@/entities/mission-store/lib/cargoProgress'
import type { JournalMission } from '@/entities/mission-store/model/journalTypes'
import { stationKey, type JournalTarget } from '@/entities/mission-store/model/useJournalTargets'
import type { StoredMission } from '@/entities/mission-store/model/types'

export function journalToStored(
  mission: JournalMission,
  targets: Map<string, JournalTarget> = new Map(),
): StoredMission | null {
  if (mission.destinationSystem === undefined || mission.destinationStation === undefined) {
    return null
  }

  const target = targets.get(mission.destinationSystem)
  const stationId = target?.stations.get(stationKey(mission.destinationStation))

  return {
    id: `journal:${mission.missionId}`,
    targetSystem: mission.destinationSystem,
    targetSystemId: target?.systemId,
    targetStation: mission.destinationStation,
    targetStationId: stationId,
    ...(awaitsCargo(mission.cargo) ? { awaitingCargo: true } : {}),
    addedAt: mission.acceptedAt,
  }
}

export function withoutDetails(missions: readonly JournalMission[]): JournalMission[] {
  return missions.filter(
    (mission) =>
      mission.destinationSystem === undefined || mission.destinationStation === undefined,
  )
}
