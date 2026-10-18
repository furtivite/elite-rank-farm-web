import type {
  CommanderPresence,
  CommanderState,
  CommanderStateResponse,
  LoadoutFacts,
} from '@/entities/commander-state/model/types'
import type { PositionVisit } from '@/entities/commander-state/model/positionHistory'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

export function parseCommanderStateResponse(input: unknown): CommanderStateResponse | null {
  if (!isRecord(input) || input.status !== 'ok' || typeof input.updatedAt !== 'string') {
    return null
  }

  const state = parseCommanderState(input.state)
  if (state === null) {
    return null
  }

  return {
    state,
    updatedAt: input.updatedAt,
    agentVersion: typeof input.agentVersion === 'string' ? input.agentVersion : null,
    finedFactions: Array.isArray(input.finedFactions)
      ? input.finedFactions.flatMap((entry) =>
          isRecord(entry) && typeof entry.name === 'string' && typeof entry.observedAt === 'string'
            ? [{ name: entry.name, observedAt: entry.observedAt }]
            : [],
        )
      : [],
    features: Array.isArray(input.features)
      ? input.features.filter((name): name is string => typeof name === 'string')
      : [],
    agentUpdateRequired: input.agentUpdateRequired === true,
  }
}

function parseCommanderState(input: unknown): CommanderState | null {
  if (!isRecord(input) || input.schemaVersion !== 4) {
    return null
  }

  const system = input.currentSystem
  if (
    !isRecord(system) ||
    typeof system.name !== 'string' ||
    !isFiniteNumber(system.x) ||
    !isFiniteNumber(system.y) ||
    !isFiniteNumber(system.z)
  ) {
    return null
  }

  if (
    typeof input.commanderName !== 'string' ||
    typeof input.ship !== 'string' ||
    typeof input.observedAt !== 'string' ||
    typeof input.imperialProgressAt !== 'string' ||
    typeof input.federalProgressAt !== 'string' ||
    !isNullableString(input.currentStation) ||
    !isNullableString(input.currentBody) ||
    !isFiniteNumber(input.jumpRangeLy) ||
    !isFiniteNumber(input.imperialRank) ||
    !isFiniteNumber(input.imperialProgress) ||
    !isFiniteNumber(input.federalRank) ||
    !isFiniteNumber(input.federalProgress)
  ) {
    return null
  }

  const presence = parsePresence(input.presence)
  const loadout = parseLoadout(input.loadout)
  const recentSystems = parseRecentSystems(input.recentSystems)

  const padSize = input.requiredPadSize
  if (padSize !== null && padSize !== 'S' && padSize !== 'M' && padSize !== 'L') {
    return null
  }

  return {
    schemaVersion: 4,
    commanderName: input.commanderName,
    currentSystem: { name: system.name, x: system.x, y: system.y, z: system.z },
    currentStation: input.currentStation,
    currentBody: input.currentBody,
    ship: input.ship,
    requiredPadSize: padSize,
    jumpRangeLy: input.jumpRangeLy,
    imperialRank: input.imperialRank,
    imperialProgress: input.imperialProgress,
    imperialProgressAt: input.imperialProgressAt,
    federalRank: input.federalRank,
    federalProgress: input.federalProgress,
    federalProgressAt: input.federalProgressAt,
    observedAt: input.observedAt,
    ...(presence === null ? {} : { presence }),
    ...(loadout === null ? {} : { loadout }),
    ...(recentSystems === null ? {} : { recentSystems }),
  }
}

function parseRecentSystems(value: unknown): PositionVisit[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const visits: PositionVisit[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue
    }

    const { name, at } = entry as { name?: unknown; at?: unknown }
    if (typeof name !== 'string' || name === '' || typeof at !== 'string') {
      continue
    }

    visits.push({ systemName: name, at })
  }

  return visits.length === 0 ? null : visits
}

function parseLoadout(input: unknown): LoadoutFacts | null {
  if (!isRecord(input)) {
    return null
  }

  if (!isFiniteNumber(input.unladenMassT) || !isFiniteNumber(input.fuelCapacityT)) {
    return null
  }

  const loadout: LoadoutFacts = {
    unladenMassT: input.unladenMassT,
    fuelCapacityT: input.fuelCapacityT,
  }

  if (isFiniteNumber(input.cargoCapacityT)) {
    loadout.cargoCapacityT = input.cargoCapacityT
  }
  if (isFiniteNumber(input.fuelLevelT)) {
    loadout.fuelLevelT = input.fuelLevelT
  }
  if (isFiniteNumber(input.cargoT)) {
    loadout.cargoT = input.cargoT
  }
  if (typeof input.fsdSymbol === 'string') {
    loadout.fsdSymbol = input.fsdSymbol
  }
  if (isFiniteNumber(input.fsdOptimalMassT)) {
    loadout.fsdOptimalMassT = input.fsdOptimalMassT
  }
  if (typeof input.fsdBoosterSymbol === 'string') {
    loadout.fsdBoosterSymbol = input.fsdBoosterSymbol
  }

  return loadout
}

function parsePresence(input: unknown): CommanderPresence | null {
  if (!isRecord(input) || typeof input.at !== 'string') {
    return null
  }

  const status = input.status
  if (status !== 'playing' && status !== 'gameExited' && status !== 'agentStopped') {
    return null
  }

  return { status, at: input.at }
}
