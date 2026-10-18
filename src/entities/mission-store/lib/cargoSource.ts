import type { JournalMission } from '@/entities/mission-store/model/journalTypes'

export type CargoSource = { systemName: string; stationName: string }

export function cargoSource(mission: JournalMission): CargoSource | null {
  const cargo = mission.cargo
  if (cargo === undefined) {
    return null
  }

  if (cargo.sourceSystem !== undefined && cargo.sourceStation !== undefined) {
    return { systemName: cargo.sourceSystem, stationName: cargo.sourceStation }
  }

  if (
    mission.name.startsWith('Mission_DeliveryWing') &&
    mission.originSystem !== undefined &&
    mission.originStation !== undefined
  ) {
    return { systemName: mission.originSystem, stationName: mission.originStation }
  }

  return null
}
