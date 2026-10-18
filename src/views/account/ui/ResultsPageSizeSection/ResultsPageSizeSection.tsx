'use client'

import { useId, useSyncExternalStore } from 'react'
import {
  getResultsPageSizeSnapshot,
  getServerResultsPageSizeSnapshot,
  PAGE_SIZES,
  subscribeToResultsPageSize,
  writeResultsPageSize,
  type ResultsPageSize,
} from '@/shared/lib/resultsOrder'
import { useTranslation } from '@/shared/lib/i18n'

export function ResultsPageSizeSection() {
  const t = useTranslation()
  const sizeId = useId()
  const hintId = useId()
  const pageSize = useSyncExternalStore(
    subscribeToResultsPageSize,
    getResultsPageSizeSnapshot,
    getServerResultsPageSizeSnapshot,
  )

  return (
    <section className="flex flex-col gap-2">
      <label htmlFor={sizeId} className="text-sm font-semibold">
        {t('resultsOrder.pageSize')}
      </label>
      <select
        id={sizeId}
        value={pageSize}
        aria-describedby={hintId}
        onChange={(event) => writeResultsPageSize(Number(event.target.value) as ResultsPageSize)}
        className="min-h-11 w-full max-w-40 rounded-md border border-warm-500 bg-white px-2 text-sm text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <p id={hintId} className="text-xs text-warm-600 dark:text-warm-400">
        {t('resultsOrder.pageSizeHint')}
      </p>
    </section>
  )
}
