'use client'

import cn from 'classnames'
import {
  closeTimeMinutes,
  describeSlotCount,
  formatSlotCount,
  MISSION_WARN_FROM,
  type CloseTimeEstimate,
  type SlotCount,
  type UseMissionStoreResult,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'

type BasketSlotsSummaryProps = {
  slots: SlotCount
  closeTime: CloseTimeEstimate
  store: UseMissionStoreResult
}

export function BasketSlotsSummary({ slots, closeTime, store }: BasketSlotsSummaryProps) {
  const t = useTranslation()
  const used = slots.used
  const isWarning = used >= MISSION_WARN_FROM

  return (
    <div
      className={cn(
        'rounded-md border p-2 text-xs',
        isWarning
          ? 'border-caution-600 bg-caution-50 text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100'
          : 'border-warm-300 bg-warm-100 text-warm-900 dark:border-warm-700 dark:bg-warm-900 dark:text-warm-100',
      )}
    >
      <p className="text-base font-semibold">
        <span aria-hidden="true">{formatSlotCount(slots)}</span>
        <span className="sr-only">{describeSlotCount(slots, t)}</span>
      </p>
      {used >= slots.limit ? (
        <p className="font-medium">{t('basket.limitReached')}</p>
      ) : used === slots.limit - 1 ? (
        <p className="font-medium">{t('basket.oneSlotLeft')}</p>
      ) : isWarning ? (
        <p>{t('basket.slotsLeft', { count: slots.limit - used })}</p>
      ) : (
        <p>{t('basket.slotsUsed')}</p>
      )}
      {slots.aside === null ? null : <p>{t('basket.manualInBrackets')}</p>}
      {store.completedCount > 0 ? (
        <p>{t('basket.completedNote', { count: store.completedCount })}</p>
      ) : null}
      {closeTime.stations === 0 ? null : (
        <p title={t('basket.closeTimeExplain')}>
          {t('basket.closeTime', {
            missions: t.plural('plural.missions', closeTime.missions),
            stations: t.plural('plural.stations', closeTime.stations),
            minutes: closeTimeMinutes(closeTime),
          })}
          {closeTime.unknownStations > 0 ? (
            <span className="ms-1">
              {t('basket.closeTimeUnknown', {
                stations: t.plural('plural.stations', closeTime.unknownStations),
              })}
            </span>
          ) : null}
        </p>
      )}
    </div>
  )
}
