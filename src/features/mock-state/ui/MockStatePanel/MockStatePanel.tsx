'use client'

import cn from 'classnames'
import { useState, useSyncExternalStore } from 'react'
import {
  getMockSnapshot,
  getServerMockSnapshot,
  setMockScenario,
  subscribeToMock,
} from '@/entities/commander-state'
import { MOCK_SCENARIOS } from '@/entities/commander-state'
import { Button } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'

export function MockStatePanel() {
  const t = useTranslation()
  const active = useSyncExternalStore(subscribeToMock, getMockSnapshot, getServerMockSnapshot)
  const [isOpen, setIsOpen] = useState(false)
  const isOn = active !== 'off'
  const current = MOCK_SCENARIOS.find((scenario) => scenario.id === active)

  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 mt-3 rounded-md border p-2 text-xs',
        isOn
          ? 'border-caution-600 bg-caution-50 text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100'
          : 'border-warm-300 bg-warm-100 text-warm-900 dark:border-warm-700 dark:bg-warm-900 dark:text-warm-100',
      )}
    >
      <details onToggle={(event) => setIsOpen(event.currentTarget.open)}>
        <summary
          className={cn(
            'flex min-h-9 cursor-pointer list-none items-center gap-2 font-medium',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400',
            '[&::-webkit-details-marker]:hidden',
          )}
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
            className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-90')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
          {t('mock.heading')}
          <span className="font-normal">
            {isOn
              ? t('mock.on', { label: current === undefined ? '' : t(current.labelKey) })
              : t('mock.off')}
          </span>
        </summary>

        <div className="mt-2 flex flex-col gap-2">
          <p className="text-warm-700 dark:text-warm-300">{t('mock.explanation')}</p>

          <ul className="flex flex-wrap gap-2">
            {MOCK_SCENARIOS.map((scenario) => (
              <li key={scenario.id}>
                <Button
                  type="button"
                  variant={scenario.id === active ? 'primary' : 'secondary'}
                  onClick={() => setMockScenario(scenario.id)}
                  aria-pressed={scenario.id === active}
                  className="min-h-9 px-2 text-xs"
                >
                  {t(scenario.labelKey)}
                </Button>
              </li>
            ))}
          </ul>

          {current === undefined ? null : (
            <p className="text-warm-700 dark:text-warm-300">{t(current.descriptionKey)}</p>
          )}
        </div>
      </details>
    </div>
  )
}
