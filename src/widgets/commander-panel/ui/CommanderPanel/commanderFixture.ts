import assert from 'node:assert/strict'
import { MOCK_SCENARIOS } from '@/entities/commander-state/model/mockScenarios'
import type { UseCommanderStateResult } from '@/entities/commander-state'

export function commanderFromScenario(id: string): UseCommanderStateResult {
  const scenario = MOCK_SCENARIOS.find((item) => item.id === id)
  assert.ok(scenario, `нет набора ${id}`)

  return {
    status: scenario.status,
    data: scenario.data,
    progress:
      scenario.progress ??
      (scenario.data === null
        ? null
        : {
            imperial: {
              percent: scenario.data.state.imperialProgress,
              at: scenario.data.state.imperialProgressAt,
            },
            federal: {
              percent: scenario.data.state.federalProgress,
              at: scenario.data.state.federalProgressAt,
            },
          }),
    errorMessage: scenario.errorMessage,
    isSignedIn: true,
    refresh: () => {},
  } as UseCommanderStateResult
}
