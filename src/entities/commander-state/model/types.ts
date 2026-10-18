import type { Coords3D } from '@/entities/galaxy-data'
import type { LoadoutFacts } from '@/entities/commander-state/lib/jumpRange'
import type { PositionVisit } from '@/entities/commander-state/model/positionHistory'

export type CommanderPresence = {
  status: 'playing' | 'gameExited' | 'agentStopped'
  at: string
}

export type CommanderState = {
  schemaVersion: 4
  commanderName: string
  currentSystem: { name: string } & Coords3D
  currentStation: string | null
  currentBody: string | null
  ship: string
  requiredPadSize: 'S' | 'M' | 'L' | null
  jumpRangeLy: number
  loadout?: LoadoutFacts
  recentSystems?: PositionVisit[]
  imperialRank: number
  imperialProgress: number
  imperialProgressAt: string
  federalRank: number
  federalProgress: number
  federalProgressAt: string
  observedAt: string
  presence?: CommanderPresence
}

export type CommanderStateResponse = {
  state: CommanderState
  updatedAt: string
  agentVersion: string | null
  features: string[]
  finedFactions: { name: string; observedAt: string }[]
  agentUpdateRequired: boolean
}

export type CommanderStateStatus =
  'guest' | 'loading' | 'success' | 'not-found' | 'unauthorized' | 'error'

export type { LoadoutFacts }
