export type JournalMission = {
  missionId: string
  name: string
  localisedName?: string
  faction?: string
  destinationSystem?: string
  destinationStation?: string
  originSystem?: string
  originStation?: string
  acceptedAt: string
  expiresAt?: string
  detailsKnown: boolean
  cargo?: MissionCargo
}

export type MissionCargo = {
  commodity?: string
  commodityLocalised?: string
  total: number
  delivered?: number
  collected?: number
  sourceMarketId?: string
  sourceSystem?: string
  sourceStation?: string
  inHold?: number
  lost?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function optionalCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined
}

function parseCargo(value: unknown): MissionCargo | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const total = optionalCount(value.total)
  if (total === undefined) {
    return undefined
  }

  return {
    commodity: optionalString(value.commodity),
    commodityLocalised: optionalString(value.commodityLocalised),
    total,
    delivered: optionalCount(value.delivered),
    collected: optionalCount(value.collected),
    sourceMarketId: optionalString(value.sourceMarketId),
    sourceSystem: optionalString(value.sourceSystem),
    sourceStation: optionalString(value.sourceStation),
    inHold: optionalCount(value.inHold),
    lost: optionalCount(value.lost),
  }
}

export function parseJournalMissions(input: unknown): JournalMission[] | null {
  if (!isRecord(input) || !Array.isArray(input.missions)) {
    return null
  }

  const missions: JournalMission[] = []

  for (const entry of input.missions) {
    if (
      !isRecord(entry) ||
      typeof entry.missionId !== 'string' ||
      typeof entry.name !== 'string' ||
      typeof entry.acceptedAt !== 'string'
    ) {
      return null
    }

    missions.push({
      missionId: entry.missionId,
      name: entry.name,
      localisedName: optionalString(entry.localisedName),
      faction: optionalString(entry.faction),
      destinationSystem: optionalString(entry.destinationSystem),
      destinationStation: optionalString(entry.destinationStation),
      originSystem: optionalString(entry.originSystem),
      originStation: optionalString(entry.originStation),
      acceptedAt: entry.acceptedAt,
      expiresAt: optionalString(entry.expiresAt),
      detailsKnown: entry.detailsKnown !== false,
      cargo: parseCargo(entry.cargo),
    })
  }

  return missions
}
