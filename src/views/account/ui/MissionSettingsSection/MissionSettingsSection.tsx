'use client'

import { useSyncExternalStore } from 'react'
import {
  getManualMissionSettings,
  getServerManualMissionSettings,
  setManualMissionSettings,
  subscribeToManualMissionSettings,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'

export function MissionSettingsSection() {
  const t = useTranslation()
  const settings = useSyncExternalStore(
    subscribeToManualMissionSettings,
    getManualMissionSettings,
    getServerManualMissionSettings,
  )

  return (
    <section aria-labelledby="mission-settings-heading" className="flex flex-col gap-2">
      <h2 id="mission-settings-heading" className="text-lg font-semibold">
        {t('missionSettings.heading')}
      </h2>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={settings.addManually}
          onChange={(event) => setManualMissionSettings({ addManually: event.target.checked })}
          className="mt-1"
        />
        <span className="flex flex-col">
          <span>{t('missionSettings.manualEntry')}</span>
          <span className="text-xs text-warm-600 dark:text-warm-400">
            {t('missionSettings.manualEntryHint')}
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={settings.excludeFromCount}
          disabled={!settings.addManually}
          onChange={(event) => setManualMissionSettings({ excludeFromCount: event.target.checked })}
          className="mt-1 disabled:opacity-60"
        />
        <span className={settings.addManually ? 'flex flex-col' : 'flex flex-col opacity-60'}>
          <span>{t('missionSettings.excludeManual')}</span>
          <span className="text-xs text-warm-600 dark:text-warm-400">
            {t('missionSettings.excludeManualHint')}
          </span>
        </span>
      </label>
    </section>
  )
}
