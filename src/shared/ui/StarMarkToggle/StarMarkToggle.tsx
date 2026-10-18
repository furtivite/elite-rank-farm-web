'use client'

import cn from 'classnames'
import { useTranslation } from '@/shared/lib/i18n'
import { BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS } from '@/shared/ui/Button'
import { SunIcon } from '@/shared/ui/icons'

export function StarMarkToggle({
  stationName,
  isMarked,
  onChange,
}: {
  stationName: string
  isMarked: boolean
  onChange: (next: boolean) => void
}) {
  const t = useTranslation()

  return (
    <label
      className={cn(
        BUTTON_BASE_CLASS,
        'min-h-8 min-w-8 cursor-pointer px-2 text-xs',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
        'has-[:focus-visible]:outline-aubergine-700 dark:has-[:focus-visible]:outline-orange-400',
        isMarked
          ? 'border border-caution-600 bg-caution-600 text-white dark:border-caution-500 dark:bg-caution-500 dark:text-warm-950'
          : BUTTON_VARIANT_CLASS.secondary,
      )}
    >
      <input
        type="checkbox"
        checked={isMarked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <SunIcon />
      <span>{t('starMark.label')}</span>
      <span className="sr-only"> — {t('starMark.hint', { station: stationName })}</span>
    </label>
  )
}
