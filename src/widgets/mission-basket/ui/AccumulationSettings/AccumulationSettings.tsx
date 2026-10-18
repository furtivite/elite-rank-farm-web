'use client'

import { useId } from 'react'
import {
  ACCUMULATION_MAX,
  ACCUMULATION_MIN,
  type AccumulationThresholds,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'

export function AccumulationSettings({
  thresholds,
  onChange,
}: {
  thresholds: AccumulationThresholds
  onChange: (next: AccumulationThresholds) => void
}) {
  const t = useTranslation()
  const reasonableId = useId()
  const highId = useId()

  return (
    <details className="text-xs">
      <summary className="min-h-9 cursor-pointer list-none py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400">
        {t('basket.thresholdLegend', { count: thresholds.reasonable })}
      </summary>

      <div className="mt-1 flex flex-wrap gap-3">
        <span className="flex flex-col gap-1">
          <label htmlFor={reasonableId}>{t('basket.reasonableFrom')}</label>
          <input
            id={reasonableId}
            type="number"
            inputMode="numeric"
            min={ACCUMULATION_MIN}
            max={ACCUMULATION_MAX}
            value={thresholds.reasonable}
            onChange={(event) =>
              onChange({ ...thresholds, reasonable: Number(event.target.value) })
            }
            className="min-h-9 w-20 rounded-md border border-warm-400 bg-warm-50 px-2 dark:border-warm-600 dark:bg-warm-950"
          />
        </span>
        <span className="flex flex-col gap-1">
          <label htmlFor={highId}>{t('basket.highFrom')}</label>
          <input
            id={highId}
            type="number"
            inputMode="numeric"
            min={ACCUMULATION_MIN}
            max={ACCUMULATION_MAX}
            value={thresholds.high}
            onChange={(event) => onChange({ ...thresholds, high: Number(event.target.value) })}
            className="min-h-9 w-20 rounded-md border border-warm-400 bg-warm-50 px-2 dark:border-warm-600 dark:bg-warm-950"
          />
        </span>
      </div>

      <p className="mt-1 text-warm-700 dark:text-warm-300">{t('basket.thresholdNote')}</p>
    </details>
  )
}
