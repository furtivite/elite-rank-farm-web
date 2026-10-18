'use client'

import { ACCUMULATION_LABEL_KEYS, type AccumulationStatus } from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'

export function AccumulationBadge({ status }: { status: AccumulationStatus }) {
  const t = useTranslation()

  if (status !== 'accumulate') {
    return null
  }

  return (
    <span className="rounded-sm border border-caution-600 bg-caution-50 px-1 text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100">
      {t(ACCUMULATION_LABEL_KEYS.accumulate)}
    </span>
  )
}
