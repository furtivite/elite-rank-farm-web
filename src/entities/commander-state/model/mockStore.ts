import { MOCK_STATE_STORAGE_KEY } from '@/shared/config/storageKeys'
import {
  findScenario,
  type MockScenario,
  type MockScenarioId,
} from '@/entities/commander-state/model/mockScenarios'

let scenarioId: MockScenarioId = 'off'
let initialized = false

const listeners = new Set<() => void>()

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true

  try {
    const raw = localStorage.getItem(MOCK_STATE_STORAGE_KEY)
    if (raw !== null && findScenario(raw as MockScenarioId).id === raw) {
      scenarioId = raw as MockScenarioId
    }
  } catch {}
}

export function getMockSnapshot(): MockScenarioId {
  ensureInitialized()
  return scenarioId
}

export function getServerMockSnapshot(): MockScenarioId {
  return 'off'
}

export function subscribeToMock(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setMockScenario(id: MockScenarioId): void {
  ensureInitialized()
  scenarioId = id

  try {
    if (id === 'off') {
      localStorage.removeItem(MOCK_STATE_STORAGE_KEY)
    } else {
      localStorage.setItem(MOCK_STATE_STORAGE_KEY, id)
    }
  } catch {}

  for (const listener of listeners) {
    listener()
  }
}

export function getActiveScenario(id: MockScenarioId): MockScenario | null {
  return id === 'off' ? null : findScenario(id)
}
