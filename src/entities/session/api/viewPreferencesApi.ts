import { withBasePath } from '@/shared/config/basePath'

export type ViewPreferences = {
  theme?: 'light' | 'dark' | 'system'
  language?: 'ru' | 'en'
  settingsPanel?: 'shown' | 'hidden'
  resultsPanel?: 'shown' | 'hidden'
  resultsOrder?: 'best' | 'nearest'
  resultsPageSize?: '10' | '25' | '50' | '100'
  otherStarsPageSize?: '10' | '25' | '50' | '100'
  jumpMultiplier?: '1' | '2' | '3' | '4' | '5'
  distanceMode?: 'straight' | 'jumps'
  accumulationReasonable?: string
  accumulationHigh?: string
}

const ACCUMULATION_VALUES = Array.from({ length: 20 }, (_, index) => String(index + 1))

export type FetchViewPreferencesResult =
  | { status: 'success'; preferences: ViewPreferences }
  | { status: 'guest' }
  | { status: 'unavailable' }

const URL = withBasePath('/api/account/view-preferences')

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

function parse(payload: unknown): ViewPreferences {
  if (typeof payload !== 'object' || payload === null) {
    return {}
  }

  const raw = (payload as { preferences?: unknown }).preferences
  if (typeof raw !== 'object' || raw === null) {
    return {}
  }

  const source = raw as Record<string, unknown>
  const result: ViewPreferences = {}

  if (source.theme === 'light' || source.theme === 'dark' || source.theme === 'system') {
    result.theme = source.theme
  }
  if (source.language === 'ru' || source.language === 'en') {
    result.language = source.language
  }
  if (source.settingsPanel === 'shown' || source.settingsPanel === 'hidden') {
    result.settingsPanel = source.settingsPanel
  }
  if (source.resultsPanel === 'shown' || source.resultsPanel === 'hidden') {
    result.resultsPanel = source.resultsPanel
  }
  if (isOneOf(source.resultsOrder, ['best', 'nearest'])) {
    result.resultsOrder = source.resultsOrder
  }
  if (isOneOf(source.resultsPageSize, ['10', '25', '50', '100'])) {
    result.resultsPageSize = source.resultsPageSize
  }
  if (isOneOf(source.otherStarsPageSize, ['10', '25', '50', '100'])) {
    result.otherStarsPageSize = source.otherStarsPageSize
  }
  if (isOneOf(source.jumpMultiplier, ['1', '2', '3', '4', '5'])) {
    result.jumpMultiplier = source.jumpMultiplier
  }
  if (isOneOf(source.distanceMode, ['straight', 'jumps'])) {
    result.distanceMode = source.distanceMode
  }
  if (isOneOf(source.accumulationReasonable, ACCUMULATION_VALUES)) {
    result.accumulationReasonable = source.accumulationReasonable
  }
  if (isOneOf(source.accumulationHigh, ACCUMULATION_VALUES)) {
    result.accumulationHigh = source.accumulationHigh
  }

  return result
}

export async function fetchViewPreferences(): Promise<FetchViewPreferencesResult> {
  let response: Response
  try {
    response = await fetch(URL, { credentials: 'include', cache: 'no-store' })
  } catch {
    return { status: 'unavailable' }
  }

  if (response.status === 401) {
    return { status: 'guest' }
  }
  if (!response.ok) {
    return { status: 'unavailable' }
  }

  try {
    return { status: 'success', preferences: parse(await response.json()) }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function saveViewPreferences(preferences: ViewPreferences): Promise<boolean> {
  try {
    const response = await fetch(URL, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences }),
    })

    return response.ok
  } catch {
    return false
  }
}
