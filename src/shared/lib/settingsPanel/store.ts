import { SETTINGS_PANEL_STORAGE_KEY, RESULTS_PANEL_STORAGE_KEY } from '@/shared/config/storageKeys'
import { createPanelStore } from '@/shared/lib/panelStore'

const settings = createPanelStore(SETTINGS_PANEL_STORAGE_KEY, true)
const results = createPanelStore(RESULTS_PANEL_STORAGE_KEY, true)

export const getSettingsPanelSnapshot = settings.getSnapshot
export const getServerSettingsPanelSnapshot = settings.getServerSnapshot
export const subscribeToSettingsPanel = settings.subscribe
export const setSettingsPanelVisible = settings.setVisible

export const getResultsPanelSnapshot = results.getSnapshot
export const getServerResultsPanelSnapshot = results.getServerSnapshot
export const subscribeToResultsPanel = results.subscribe
export const setResultsPanelVisible = results.setVisible
