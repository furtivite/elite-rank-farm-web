import type { StoredMission } from '@/entities/mission-store/model/types'

export function mergeMissions(
  left: readonly StoredMission[],
  right: readonly StoredMission[],
): StoredMission[] {
  const merged = [...left]
  const known = new Set(left.map((mission) => mission.id))

  for (const mission of right) {
    if (!known.has(mission.id)) {
      merged.push(mission)
      known.add(mission.id)
    }
  }

  return merged.sort((first, second) => first.addedAt.localeCompare(second.addedAt))
}
