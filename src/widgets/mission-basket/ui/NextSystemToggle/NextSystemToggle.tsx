'use client'

import cn from 'classnames'
import { BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'

const TOGGLE_CLASS = cn(
  BUTTON_BASE_CLASS,
  'min-h-8 min-w-8 cursor-pointer px-2 text-xs',
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
  'has-[:focus-visible]:outline-aubergine-700 dark:has-[:focus-visible]:outline-orange-400',
)

export function NextSystemToggle({
  systemName,
  isNext,
  onChange,
}: {
  systemName: string
  isNext: boolean
  onChange: (next: boolean) => void
}) {
  const t = useTranslation()

  return (
    <label
      className={cn(
        TOGGLE_CLASS,
        isNext ? BUTTON_VARIANT_CLASS.primary : BUTTON_VARIANT_CLASS.secondary,
      )}
    >
      <input
        type="checkbox"
        checked={isNext}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span className="sr-only">{t('basket.makeNextSr', { system: systemName })}</span>
      <span aria-hidden="true">{isNext ? t('basket.isNext') : t('basket.makeNext')}</span>
    </label>
  )
}
