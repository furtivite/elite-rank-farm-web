import type { Translate } from '@/shared/lib/i18n'

export type NavyRankMission = 'imperial' | 'federal' | null

export function rankMissionSide(missionName: string | undefined): NavyRankMission {
  if (missionName === undefined) {
    return null
  }

  const name = missionName.toLowerCase()

  if (name.includes('rankemp')) {
    return 'imperial'
  }
  if (name.includes('rankfed')) {
    return 'federal'
  }

  return null
}

export function rankMissionLabel(side: NavyRankMission, t: Translate): string | null {
  if (side === 'imperial') {
    return t('mission.rankImperial')
  }
  if (side === 'federal') {
    return t('mission.rankFederal')
  }
  return null
}

export function rankStationKey(systemName: string, stationName: string): string {
  return `${systemName.trim().toLowerCase()}|${stationName.trim().toLowerCase()}`
}

export function rankSidesByStation(
  missions: readonly {
    name: string
    destinationSystem?: string
    destinationStation?: string
  }[],
): Map<string, Exclude<NavyRankMission, null>> {
  const sides = new Map<string, Exclude<NavyRankMission, null>>()

  for (const mission of missions) {
    const side = rankMissionSide(mission.name)
    if (
      side === null ||
      mission.destinationSystem === undefined ||
      mission.destinationStation === undefined
    ) {
      continue
    }

    const key = rankStationKey(mission.destinationSystem, mission.destinationStation)
    if (!sides.has(key)) {
      sides.set(key, side)
    }
  }

  return sides
}

export function activeRankSides(
  missions: readonly { name: string }[],
): Set<Exclude<NavyRankMission, null>> {
  const sides = new Set<Exclude<NavyRankMission, null>>()

  for (const mission of missions) {
    const side = rankMissionSide(mission.name)
    if (side !== null) {
      sides.add(side)
    }
  }

  return sides
}
