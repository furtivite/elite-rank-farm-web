import { rankStationKey } from '@/entities/mission-store/lib/rankMission'
import type { StoredMission } from '@/entities/mission-store/model/types'

export function journalTargets(journalMissions: readonly StoredMission[]): Set<string> {
  return new Set(
    journalMissions.map((mission) => rankStationKey(mission.targetSystem, mission.targetStation)),
  )
}

export function looksLikeDuplicate(
  targets: Set<string>,
  systemName: string,
  stationName: string,
): boolean {
  return targets.has(rankStationKey(systemName, stationName))
}
