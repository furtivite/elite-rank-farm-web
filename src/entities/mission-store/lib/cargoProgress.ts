import type { MissionCargo } from '@/entities/mission-store/model/journalTypes'

export type CargoProgress = {
  remaining: number
  inHold: number
  lost: number
  toCollect: number
  runsLeft: number | null
}

export function cargoProgress(
  cargo: MissionCargo,
  cargoCapacityT: number | undefined,
): CargoProgress {
  const delivered = cargo.delivered ?? 0
  const remaining = Math.max(0, cargo.total - delivered)
  const lost = cargo.lost ?? 0

  const inHold =
    cargo.inHold !== undefined
      ? Math.min(remaining, cargo.inHold)
      : cargo.collected === undefined
        ? 0
        : Math.max(0, Math.min(remaining, cargo.collected - delivered - lost))

  const capacity =
    cargoCapacityT !== undefined && Number.isFinite(cargoCapacityT) && cargoCapacityT > 0
      ? Math.floor(cargoCapacityT)
      : null

  const toCollect = Math.max(0, remaining - inHold)

  if (capacity === null) {
    return { remaining, inHold, lost, toCollect, runsLeft: null }
  }

  return { remaining, inHold, lost, toCollect, runsLeft: Math.ceil(toCollect / capacity) }
}

export function awaitsCargo(cargo: MissionCargo | undefined): boolean {
  if (cargo?.inHold === undefined) {
    return false
  }
  return cargo.inHold < cargo.total - (cargo.delivered ?? 0)
}
