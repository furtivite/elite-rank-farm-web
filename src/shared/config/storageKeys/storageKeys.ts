import type { TranslationKey } from '@/shared/lib/i18n'

export const THEME_STORAGE_KEY = 'elite:theme'
export const STATION_RATINGS_STORAGE_KEY = 'elite:station-ratings'
export const MISSION_STORE_STORAGE_KEY = 'elite:missions'
export const RETURN_REMINDERS_STORAGE_KEY = 'elite:mission-returns'
export const RETURN_LEGS_STORAGE_KEY = 'elite:return-legs'
export const NEXT_DESTINATION_PIN_STORAGE_KEY = 'elite:next-destination-pin'
export const SESSION_CACHE_STORAGE_KEY = 'elite:session-login'
export const LAST_COMMANDER_STORAGE_KEY = 'elite:last-commander'
export const MOCK_STATE_STORAGE_KEY = 'elite:mock-commander-state'
export const SETTINGS_PANEL_STORAGE_KEY = 'elite:settings-panel'
export const RESULTS_ORDER_STORAGE_KEY = 'elite:results-order'
export const RESULTS_PAGE_SIZE_STORAGE_KEY = 'elite:results-page-size'
export const TAB_LEADER_STORAGE_KEY = 'elite:tab-leader'

export const POSITION_HISTORY_STORAGE_KEY = 'elite:position-history'

export const OTHER_STARS_PAGE_SIZE_STORAGE_KEY = 'elite:other-stars-page-size'

export const JUMP_MULTIPLIER_STORAGE_KEY = 'elite:jump-multiplier'
export const DISTANCE_MODE_STORAGE_KEY = 'elite:distance-mode'
export const ACCUMULATION_STORAGE_KEY = 'elite:accumulation-thresholds'
export const FARM_CLUSTERS_STORAGE_KEY = 'elite:farm-clusters'

export const RESULTS_PANEL_STORAGE_KEY = 'elite:results-panel'

export const LANGUAGE_STORAGE_KEY = 'elite:language'

export const MANUAL_MISSIONS_STORAGE_KEY = 'elite:manual-missions'

export const STORAGE_NOTES: ReadonlyArray<{ key: string; what: TranslationKey }> = [
  { key: MISSION_STORE_STORAGE_KEY, what: 'storage.missions' },
  { key: RETURN_REMINDERS_STORAGE_KEY, what: 'storage.returnReminders' },
  { key: RETURN_LEGS_STORAGE_KEY, what: 'storage.returnLegs' },
  { key: STATION_RATINGS_STORAGE_KEY, what: 'storage.ratings' },
  { key: FARM_CLUSTERS_STORAGE_KEY, what: 'storage.clusters' },
  { key: ACCUMULATION_STORAGE_KEY, what: 'storage.accumulation' },
  { key: MANUAL_MISSIONS_STORAGE_KEY, what: 'storage.missionSettings' },
  { key: NEXT_DESTINATION_PIN_STORAGE_KEY, what: 'storage.pinnedTarget' },
  { key: THEME_STORAGE_KEY, what: 'storage.theme' },
  { key: LANGUAGE_STORAGE_KEY, what: 'storage.language' },
  { key: SETTINGS_PANEL_STORAGE_KEY, what: 'storage.settingsPanel' },
  { key: RESULTS_PANEL_STORAGE_KEY, what: 'storage.resultsPanel' },
  { key: RESULTS_ORDER_STORAGE_KEY, what: 'storage.resultsOrder' },
  { key: RESULTS_PAGE_SIZE_STORAGE_KEY, what: 'storage.resultsPageSize' },
  { key: OTHER_STARS_PAGE_SIZE_STORAGE_KEY, what: 'storage.otherStarsPageSize' },
  { key: POSITION_HISTORY_STORAGE_KEY, what: 'storage.positionHistory' },
  { key: TAB_LEADER_STORAGE_KEY, what: 'storage.tabLeader' },
  { key: JUMP_MULTIPLIER_STORAGE_KEY, what: 'storage.jumpMultiplier' },
  { key: DISTANCE_MODE_STORAGE_KEY, what: 'storage.distanceMode' },
  { key: MOCK_STATE_STORAGE_KEY, what: 'storage.mock' },
  { key: SESSION_CACHE_STORAGE_KEY, what: 'storage.login' },
  { key: LAST_COMMANDER_STORAGE_KEY, what: 'storage.lastCommander' },
]
