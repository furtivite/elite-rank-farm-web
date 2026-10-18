import type { BlockedBase } from '@/features/blocked-bases'
import type { MissionSystemGroup } from '@/entities/mission-store'

export function blockedInBasketSystems(
  bases: readonly BlockedBase[],
  groups: readonly MissionSystemGroup[],
): BlockedBase[] {
  const systems = new Set(groups.map((group) => normalize(group.systemName)))

  return bases.filter((base) => systems.has(normalize(base.systemName)))
}

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}
