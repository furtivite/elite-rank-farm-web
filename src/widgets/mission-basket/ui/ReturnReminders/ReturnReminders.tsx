'use client'

import type { ReturnReminder } from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'
import { RepeatIcon } from '@/shared/ui/icons'

export function ReturnReminders({
  reminders,
  onDismiss,
}: {
  reminders: readonly ReturnReminder[]
  onDismiss: (id: string) => void
}) {
  const t = useTranslation()

  if (reminders.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="return-reminders-heading"
      className="flex flex-col gap-2 rounded-md border border-aubergine-700 p-2 dark:border-orange-500"
    >
      <h2 id="return-reminders-heading" className="sr-only">
        {t('basket.returnFlight')}
      </h2>

      <ul className="flex flex-col gap-2">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-sm bg-aubergine-700 px-1.5 text-xs font-medium text-white dark:bg-orange-500 dark:text-warm-950">
              <RepeatIcon />
              {t('basket.returnFlight')}
            </span>

            <span className="min-w-0 break-words font-semibold">
              {reminder.systemName} · {reminder.stationName}
            </span>

            <button
              type="button"
              onClick={() => onDismiss(reminder.id)}
              className="ms-auto inline-flex min-h-11 items-center rounded-md border border-warm-300 px-2 text-xs font-medium text-warm-700 hover:bg-warm-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-600 dark:text-warm-300 dark:hover:bg-warm-800 dark:focus-visible:outline-orange-400"
            >
              {t('basket.returnDone')}
              <span className="sr-only">
                {' '}
                — {reminder.systemName}, {reminder.stationName}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
