import type {
  CachedStation,
  CachedSystem,
  GalaxyRegionId,
  StationFaction,
  StationFactionSummary,
} from '@/entities/galaxy-data/model/types'

const ALLEGIANCES = ['Empire', 'Federation', 'Alliance', 'Independent', 'Other'] as const
const REGION_IDS: GalaxyRegionId[] = ['imperial-ngalinn', 'federal-canopus', 'galaxy']
const PAD_SIZES = ['S', 'M', 'L'] as const

const DATA_SOURCES = ['journal', 'external', 'builder'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}

function parseFaction(input: unknown): StationFaction | null {
  if (!isRecord(input) || !isNonEmptyString(input.name)) {
    return null
  }

  const allegiance = ALLEGIANCES.find((known) => known === input.allegiance)
  return allegiance === undefined ? null : { name: input.name, allegiance }
}

function parseSummary(input: unknown): StationFactionSummary | null {
  if (
    !isRecord(input) ||
    !isFiniteNumber(input.imperial) ||
    !isFiniteNumber(input.federal) ||
    !isFiniteNumber(input.alliance) ||
    !isFiniteNumber(input.independent) ||
    !isFiniteNumber(input.other)
  ) {
    return null
  }

  return {
    imperial: input.imperial,
    federal: input.federal,
    alliance: input.alliance,
    independent: input.independent,
    other: input.other,
  }
}

function parseStation(input: unknown, systemId: string): CachedStation | null {
  if (
    !isRecord(input) ||
    !isNonEmptyString(input.id) ||
    !isNonEmptyString(input.name) ||
    !isNonEmptyString(input.updatedAt)
  ) {
    return null
  }

  if (input.systemId !== systemId) {
    return null
  }

  const station: CachedStation = {
    id: input.id,
    systemId,
    name: input.name,
    missionProviderFactions: { status: 'unknown' },
    updatedAt: input.updatedAt,
  }

  if (isNonEmptyString(input.bodyName)) {
    station.bodyName = input.bodyName
  }
  const star = input.star
  if (isRecord(star) && typeof star.isMain === 'boolean') {
    const source = star.source === 'manual' ? 'manual' : 'dump'
    station.star = {
      isMain: star.isMain,
      source,
      ...(isNonEmptyString(star.name) ? { name: star.name } : {}),
    }
  }
  if (isNonEmptyString(input.type)) {
    station.type = input.type
  }
  if (isFiniteNumber(input.distanceToArrivalLs)) {
    station.distanceToArrivalLs = input.distanceToArrivalLs
  }
  const padSize = PAD_SIZES.find((known) => known === input.maxPadSize)
  if (padSize !== undefined) {
    station.maxPadSize = padSize
  }
  if (typeof input.hasMissionBoard === 'boolean') {
    station.hasMissionBoard = input.hasMissionBoard
    const boardSource = DATA_SOURCES.find((known) => known === input.missionBoardSource)
    if (boardSource !== undefined) {
      station.missionBoardSource = boardSource
    }
  }
  const controlling = parseFaction(input.controllingFaction)
  if (controlling !== null) {
    station.controllingFaction = controlling
  }

  return station
}

export function parseCachedSystem(input: unknown): CachedSystem | null {
  if (
    !isRecord(input) ||
    !isNonEmptyString(input.id) ||
    !isNonEmptyString(input.name) ||
    !isFiniteNumber(input.x) ||
    !isFiniteNumber(input.y) ||
    !isFiniteNumber(input.z) ||
    !isNonEmptyString(input.updatedAt) ||
    !Array.isArray(input.regionIds) ||
    !Array.isArray(input.systemFactions) ||
    !Array.isArray(input.stations)
  ) {
    return null
  }

  const summary = parseSummary(input.systemFactionSummary)
  if (summary === null) {
    return null
  }

  const regionIds: GalaxyRegionId[] = []
  for (const regionId of input.regionIds) {
    const known = REGION_IDS.find((candidate) => candidate === regionId)
    if (known === undefined) {
      return null
    }
    regionIds.push(known)
  }

  const systemFactions: StationFaction[] = []
  for (const faction of input.systemFactions) {
    const parsed = parseFaction(faction)
    if (parsed === null) {
      return null
    }
    systemFactions.push(parsed)
  }

  const stations: CachedStation[] = []
  for (const station of input.stations) {
    const parsed = parseStation(station, input.id)
    if (parsed === null) {
      return null
    }
    stations.push(parsed)
  }

  return {
    id: input.id,
    name: input.name,
    x: input.x,
    y: input.y,
    z: input.z,
    regionIds,
    updatedAt: input.updatedAt,
    systemFactions,
    systemFactionSummary: summary,
    stations,
  }
}
