'use client'

import { useEffect, useRef } from 'react'
import { fetchViewPreferences, saveViewPreferences, type ViewPreferences } from '@/entities/session'
import {
  getResultsPanelSnapshot,
  getSettingsPanelSnapshot,
  setResultsPanelVisible,
  setSettingsPanelVisible,
  subscribeToResultsPanel,
  subscribeToSettingsPanel,
} from '@/shared/lib/settingsPanel'
import {
  getLanguageSnapshot,
  subscribeToLanguage,
  writeLanguage,
  type Language,
} from '@/shared/lib/i18n'
import {
  getThemeSnapshot,
  subscribeToTheme,
  writeTheme,
  type ThemePreference,
} from '@/shared/lib/theme'
import {
  getResultsOrderSnapshot,
  getResultsPageSizeSnapshot,
  subscribeToResultsOrder,
  subscribeToResultsPageSize,
  writeResultsOrder,
  writeResultsPageSize,
  type ResultsOrder,
  type ResultsPageSize,
} from '@/shared/lib/resultsOrder'
import {
  getOtherStarsPageSizeSnapshot,
  subscribeToOtherStarsPageSize,
  writeOtherStarsPageSize,
  type OtherStarsPageSize,
} from '@/shared/lib/otherStarsPageSize'
import {
  getJumpMultiplierSnapshot,
  subscribeToJumpMultiplier,
  writeJumpMultiplier,
  type JumpMultiplier,
} from '@/shared/lib/searchRadius'
import {
  getDistanceModeSnapshot,
  subscribeToDistanceMode,
  writeDistanceMode,
  type DistanceMode,
} from '@/shared/lib/distanceMode'
import {
  getAccumulationSnapshot,
  setAccumulationThresholds,
  subscribeToAccumulation,
} from '@/entities/mission-store'

const SAVE_DELAY_MS = 800

function readLocal(): ViewPreferences {
  return {
    theme: getThemeSnapshot(),
    language: getLanguageSnapshot(),
    settingsPanel: getSettingsPanelSnapshot() ? 'shown' : 'hidden',
    resultsPanel: getResultsPanelSnapshot() ? 'shown' : 'hidden',
    resultsOrder: getResultsOrderSnapshot(),
    resultsPageSize: String(getResultsPageSizeSnapshot()) as ViewPreferences['resultsPageSize'],
    otherStarsPageSize: String(
      getOtherStarsPageSizeSnapshot(),
    ) as ViewPreferences['otherStarsPageSize'],
    jumpMultiplier: String(getJumpMultiplierSnapshot()) as ViewPreferences['jumpMultiplier'],
    distanceMode: getDistanceModeSnapshot(),
    accumulationReasonable: String(getAccumulationSnapshot().reasonable),
    accumulationHigh: String(getAccumulationSnapshot().high),
  }
}

function apply(preferences: ViewPreferences): void {
  if (preferences.theme !== undefined) {
    writeTheme(preferences.theme as ThemePreference)
  }
  if (preferences.language !== undefined) {
    writeLanguage(preferences.language as Language)
  }
  if (preferences.resultsOrder !== undefined) {
    writeResultsOrder(preferences.resultsOrder as ResultsOrder)
  }
  if (preferences.resultsPageSize !== undefined) {
    writeResultsPageSize(Number(preferences.resultsPageSize) as ResultsPageSize)
  }
  if (preferences.otherStarsPageSize !== undefined) {
    writeOtherStarsPageSize(Number(preferences.otherStarsPageSize) as OtherStarsPageSize)
  }
  if (preferences.jumpMultiplier !== undefined) {
    writeJumpMultiplier(Number(preferences.jumpMultiplier) as JumpMultiplier)
  }
  if (preferences.distanceMode !== undefined) {
    writeDistanceMode(preferences.distanceMode as DistanceMode)
  }
  if (preferences.settingsPanel !== undefined) {
    setSettingsPanelVisible(preferences.settingsPanel === 'shown')
  }
  if (preferences.resultsPanel !== undefined) {
    setResultsPanelVisible(preferences.resultsPanel === 'shown')
  }
  if (
    preferences.accumulationReasonable !== undefined &&
    preferences.accumulationHigh !== undefined
  ) {
    setAccumulationThresholds({
      reasonable: Number(preferences.accumulationReasonable),
      high: Number(preferences.accumulationHigh),
    })
  }
}

function same(left: ViewPreferences, right: ViewPreferences): boolean {
  return (
    left.theme === right.theme &&
    left.language === right.language &&
    left.settingsPanel === right.settingsPanel &&
    left.resultsPanel === right.resultsPanel &&
    left.resultsOrder === right.resultsOrder &&
    left.resultsPageSize === right.resultsPageSize &&
    left.otherStarsPageSize === right.otherStarsPageSize &&
    left.jumpMultiplier === right.jumpMultiplier &&
    left.distanceMode === right.distanceMode &&
    left.accumulationReasonable === right.accumulationReasonable &&
    left.accumulationHigh === right.accumulationHigh
  )
}

export function useViewPreferencesSync(isSignedIn: boolean): void {
  const loaded = useRef(false)
  const lastSaved = useRef<ViewPreferences | null>(null)

  useEffect(() => {
    loaded.current = false
    lastSaved.current = null

    if (!isSignedIn) {
      return
    }

    let cancelled = false

    void fetchViewPreferences().then((result) => {
      if (cancelled) {
        return
      }

      if (result.status === 'success') {
        apply(result.preferences)
        lastSaved.current = { ...readLocal(), ...result.preferences }
      } else {
        lastSaved.current = readLocal()
      }

      loaded.current = true
    })

    return () => {
      cancelled = true
    }
  }, [isSignedIn])

  useEffect(() => {
    if (!isSignedIn) {
      return
    }

    let timer: number | undefined

    const schedule = () => {
      if (!loaded.current) {
        return
      }

      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const current = readLocal()
        if (lastSaved.current !== null && same(lastSaved.current, current)) {
          return
        }

        lastSaved.current = current
        void saveViewPreferences(current)
      }, SAVE_DELAY_MS)
    }

    const unsubscribe = [
      subscribeToTheme(schedule),
      subscribeToLanguage(schedule),
      subscribeToSettingsPanel(schedule),
      subscribeToResultsPanel(schedule),
      subscribeToResultsOrder(schedule),
      subscribeToResultsPageSize(schedule),
      subscribeToOtherStarsPageSize(schedule),
      subscribeToJumpMultiplier(schedule),
      subscribeToDistanceMode(schedule),
      subscribeToAccumulation(schedule),
    ]

    return () => {
      window.clearTimeout(timer)
      for (const stop of unsubscribe) {
        stop()
      }
    }
  }, [isSignedIn])
}
