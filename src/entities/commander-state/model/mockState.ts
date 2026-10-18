import type { CommanderStateResponse } from '@/entities/commander-state/model/types'

export const NGALINN = { name: 'Ngalinn', x: 8.625, y: -219.84375, z: -60.84375 }
export const CANOPUS = { name: 'Canopus', x: 276.625, y: -131.34375, z: -42.4375 }

export const DEEP_SPACE = { name: 'Deep space', x: 0, y: 0, z: 0 }

export const MAINANI = { name: 'Mainani', x: 10.40625, y: -219.8125, z: -64.21875 }

export const OBSERVED_AT = '2026-09-03T12:00:00Z'
export const PROMOTION_AT = '2026-09-03T11:30:00Z'
export const SESSION_START_AT = '2026-09-03T09:00:00Z'
export const UPDATED_AT = '2026-09-03T12:00:05Z'

export const JUST_NOW = new Date(Date.now() - 60 * 1000).toISOString()

export const MOCK_AGENT_VERSION = '0.2.0-beta.1'

export function state(
  overrides: Partial<CommanderStateResponse['state']> = {},
  responseOverrides: Partial<Omit<CommanderStateResponse, 'state'>> = {},
): CommanderStateResponse {
  return {
    state: {
      schemaVersion: 4,
      commanderName: 'DEMO CMDR',
      currentSystem: NGALINN,
      currentStation: 'Hickam Survey',
      currentBody: null,
      ship: 'python',
      requiredPadSize: 'L',
      jumpRangeLy: 42,
      imperialRank: 8,
      imperialProgress: 64,
      imperialProgressAt: SESSION_START_AT,
      federalRank: 2,
      federalProgress: 100,
      federalProgressAt: SESSION_START_AT,
      observedAt: OBSERVED_AT,
      ...overrides,
    },
    updatedAt: UPDATED_AT,
    agentVersion: MOCK_AGENT_VERSION,
    features: [],
    finedFactions: [],
    agentUpdateRequired: false,
    ...responseOverrides,
  }
}
