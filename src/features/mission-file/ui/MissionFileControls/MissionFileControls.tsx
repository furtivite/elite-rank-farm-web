'use client'

import { useRef, useState } from 'react'
import type { StoredMission } from '@/entities/mission-store'
import { downloadMissions } from '@/features/mission-file/lib/downloadMissions'
import { readMissionsFile } from '@/features/mission-file/lib/readMissionsFile'
import { Button } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'

export function MissionFileControls({
  missions,
  onReplaceAll,
}: {
  missions: readonly StoredMission[]
  onReplaceAll: (missions: StoredMission[]) => void
}) {
  const t = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const importFile = async (file: File) => {
    setError(null)
    const result = await readMissionsFile(file)

    if (result.status === 'invalid') {
      setError(t('basket.importNotJson'))
      return
    }
    if (result.status === 'empty') {
      setError(t('basket.importNoMissions'))
      return
    }

    onReplaceAll(result.missions)
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="secondary"
        onClick={() => downloadMissions(missions)}
        disabled={missions.length === 0}
        className="min-h-8 px-2 text-xs"
      >
        {t('basket.exportJson')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        className="min-h-8 px-2 text-xs"
      >
        {t('basket.importJson')}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label={t('basket.missionFile')}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void importFile(file)
          }
          event.target.value = ''
        }}
      />
      <p className="w-full text-warm-500 dark:text-warm-400">{t('basket.importReplaces')}</p>
      {error !== null ? (
        <p role="alert" className="w-full text-danger-700 dark:text-danger-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
