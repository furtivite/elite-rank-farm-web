'use client'

import cn from 'classnames'
import { useSyncExternalStore } from 'react'
import {
  getLanguageSnapshot,
  getServerLanguageSnapshot,
  LANGUAGES,
  LANGUAGE_LABEL,
  subscribeToLanguage,
  useTranslation,
  writeLanguage,
} from '@/shared/lib/i18n'

export function LanguageSwitch({ className }: { className?: string }) {
  const t = useTranslation()
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  )

  return (
    <div
      className={cn('flex items-start gap-1', className)}
      role="group"
      aria-label={t('header.language')}
    >
      {LANGUAGES.map((code) => {
        const selected = code === language

        return (
          <button
            key={code}
            type="button"
            onClick={() => writeLanguage(code)}
            aria-pressed={selected}
            className={cn(
              'flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 px-2 text-sm font-normal',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400',
              selected
                ? 'text-warm-900 dark:text-warm-100'
                : 'text-warm-600 hover:text-warm-900 dark:text-warm-400 dark:hover:text-warm-100',
            )}
          >
            <span className="leading-none">{LANGUAGE_LABEL[code]}</span>
            <span
              aria-hidden="true"
              className={cn(
                'block size-1.5 rounded-full',
                selected ? 'bg-aubergine-700 dark:bg-orange-400' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
