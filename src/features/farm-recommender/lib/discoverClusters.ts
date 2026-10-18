import { distanceLy, type ClusterCandidateEntry, type RegionClusters } from '@/entities/galaxy-data'
import type { PadSize } from '@/features/farm-recommender/model/types'

export type ClusterCandidate = {
  centerSystem: string
  radiusLy: number
  systems: number
  stations: number
  stationsNearStar: number
  medianArrivalLs: number | null
}

export type ClusterCandidateInput = {
  clusters: RegionClusters
  padSize?: PadSize
  excludeSurface?: boolean
  limit?: number
}

const MIN_CENTER_SEPARATION_LY = 8

export function clusterFilterKey(padSize: PadSize | undefined, excludeSurface: boolean): string {
  const pad = padSize === 'M' || padSize === 'L' ? padSize : 'any'
  return `${pad}:${excludeSurface ? 'orbital' : 'all'}`
}

export function discoverClusters({
  clusters,
  padSize,
  excludeSurface = false,
  limit = 5,
}: ClusterCandidateInput): ClusterCandidate[] {
  const key = clusterFilterKey(padSize, excludeSurface)

  const candidates: Array<{ entry: ClusterCandidateEntry; candidate: ClusterCandidate }> = []
  for (const entry of clusters.candidates) {
    const metrics = entry.byFilter[key]
    if (metrics === undefined) {
      continue
    }

    candidates.push({
      entry,
      candidate: {
        centerSystem: entry.systemName,
        radiusLy: clusters.radiusLy,
        systems: metrics.systems,
        stations: metrics.stations,
        stationsNearStar: metrics.stationsNearStar,
        medianArrivalLs: metrics.medianArrivalLs,
      },
    })
  }

  candidates.sort(
    (a, b) =>
      b.candidate.stationsNearStar - a.candidate.stationsNearStar ||
      b.candidate.stations - a.candidate.stations ||
      a.candidate.centerSystem.localeCompare(b.candidate.centerSystem, undefined, {
        numeric: true,
      }),
  )

  const chosen: Array<{ entry: ClusterCandidateEntry; candidate: ClusterCandidate }> = []

  for (const item of candidates) {
    const tooClose = chosen.some(
      (picked) => distanceLy(item.entry, picked.entry) < MIN_CENTER_SEPARATION_LY,
    )
    if (tooClose) {
      continue
    }

    chosen.push(item)
    if (chosen.length >= limit) {
      break
    }
  }

  return chosen.map((item) => item.candidate)
}
