import type { SystemIndexEntry } from '@/entities/galaxy-data'
import type { PadSize } from '@/features/farm-recommender/model/types'

export function isWorthLoading(entry: SystemIndexEntry, padSize: PadSize | undefined): boolean {
  if (entry.missionBoards === 0) {
    return false
  }

  return !(padSize === 'L' && entry.largePad === false)
}
