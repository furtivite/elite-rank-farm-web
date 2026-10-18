'use client'

import cn from 'classnames'
import { useTranslation, type TranslationKey } from '@/shared/lib/i18n'
import { THEME_PREFERENCES, useTheme } from '@/shared/lib/theme'
import { ComputerIcon, MoonIcon, SunIcon } from '@/features/toggle-theme/ui/ThemeIcons/ThemeIcons'

const ICONS: Record<(typeof THEME_PREFERENCES)[number], () => React.JSX.Element> = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerIcon,
}

const LABEL_KEYS: Record<(typeof THEME_PREFERENCES)[number], TranslationKey> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
}

const ORDER: readonly (typeof THEME_PREFERENCES)[number][] = ['light', 'system', 'dark']

export function ThemeToggle() {
  const t = useTranslation()
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="group"
      aria-label={t('theme.group')}
      className="inline-flex gap-1 rounded-md border border-warm-300 p-0.5 dark:border-warm-600"
    >
      {ORDER.map((value) => {
        const Icon = ICONS[value]
        const label = t(LABEL_KEYS[value])
        const selected = preference === value

        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={selected}
            onClick={() => {
              setPreference(value)
            }}
            className={cn(
              'flex size-8 items-center justify-center rounded',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400',
              selected
                ? 'bg-aubergine-700 text-white dark:bg-orange-500 dark:text-warm-950'
                : 'text-warm-700 hover:bg-warm-200 dark:text-warm-300 dark:hover:bg-warm-700',
            )}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}
