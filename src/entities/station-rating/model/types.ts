export type StationRatingValue = 'good' | 'bad' | 'blocked'

export type StationRatingEntry = {
  rating?: StationRatingValue
  missionCount?: number
  blockedAt?: string
  note?: string
  systemId?: string
  systemName?: string
  updatedAt: string
}

export type StationRatingsMap = Record<string, StationRatingEntry>
