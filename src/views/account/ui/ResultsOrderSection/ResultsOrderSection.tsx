'use client'

import { useId, useSyncExternalStore } from 'react'
import cn from 'classnames'
import {
  getResultsOrderSnapshot,
  getServerResultsOrderSnapshot,
  subscribeToResultsOrder,
  writeResultsOrder,
  type ResultsOrder,
} from '@/shared/lib/resultsOrder'
import { useTranslation } from '@/shared/lib/i18n'

const OPTIONS: readonly ResultsOrder[] = ['nearest', 'best']

const LABEL_KEYS = {
  nearest: 'resultsOrder.nearest',
  best: 'resultsOrder.best',
} as const

const HINT_KEYS = {
  nearest: 'resultsOrder.nearestHint',
  best: 'resultsOrder.bestHint',
} as const

export function ResultsOrderSection() {
  const t = useTranslation()
  const hintId = useId()
  const groupName = useId()
  const order = useSyncExternalStore(
    subscribeToResultsOrder,
    getResultsOrderSnapshot,
    getServerResultsOrderSnapshot,
  )

  return (
    <section className="flex flex-col gap-2">
      <fieldset
        aria-describedby={hintId}
        className="flex w-fit flex-col rounded-md border border-warm-300 px-2 pb-1 dark:border-warm-600"
      >
        <legend className="px-1 text-sm font-semibold">{t('resultsOrder.heading')}</legend>

        {OPTIONS.map((value) => (
          <label
            key={value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-2 px-1 text-sm font-medium',
              order === value
                ? 'text-warm-900 dark:text-warm-100'
                : 'text-warm-700 dark:text-warm-300',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={value}
              checked={order === value}
              onChange={() => writeResultsOrder(value)}
              className="size-4 accent-aubergine-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:accent-orange-500 dark:focus-visible:outline-orange-400"
            />
            {t(LABEL_KEYS[value])}
          </label>
        ))}
      </fieldset>

      <p id={hintId} className="text-xs text-warm-600 dark:text-warm-400">
        {t(HINT_KEYS[order])}
      </p>
    </section>
  )
}
