'use client'

import { useState } from 'react'
import type { UseMissionStoreResult } from '@/entities/mission-store'
import { MissionFileControls } from '@/features/mission-file'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'

type BasketBulkControlsProps = {
  store: UseMissionStoreResult
}

export function BasketBulkControls({ store }: BasketBulkControlsProps) {
  const t = useTranslation()
  const [confirmingClear, setConfirmingClear] = useState(false)

  return (
    <>
      {store.missions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {store.completedCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={store.clearCompleted}
              className="min-h-8 px-2 text-xs"
            >
              {t('basket.clearCompleted')}
            </Button>
          ) : null}

          {confirmingClear ? (
            <>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  store.clearAll()
                  setConfirmingClear(false)
                }}
                className="min-h-8 px-2 text-xs"
              >
                {t('basket.deleteAllConfirm', { count: store.usedSlots })}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmingClear(false)}
                className="min-h-8 px-2 text-xs"
              >
                {t('basket.cancel')}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingClear(true)}
              className="min-h-8 px-2 text-xs"
            >
              {t('basket.clearAll')}
            </Button>
          )}
        </div>
      ) : null}

      <details className="text-xs">
        <summary className="cursor-pointer text-warm-600 dark:text-warm-400">
          {t('basket.exportImport')}
        </summary>
        <MissionFileControls missions={store.missions} onReplaceAll={store.replaceAll} />
      </details>
    </>
  )
}
