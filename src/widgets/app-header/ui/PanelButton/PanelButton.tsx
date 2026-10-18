'use client'

import cn from 'classnames'
import type { ReactNode } from 'react'

export type PanelToggle = {
  isVisible: boolean
  onToggle: () => void
  controlsId: string
}

export function PanelButton({
  panel,
  icon,
  showLabel,
  hideLabel,
  absentLabel,
}: {
  panel: PanelToggle | undefined
  icon: ReactNode
  showLabel: string
  hideLabel: string
  absentLabel: string
}) {
  const isAbsent = panel === undefined

  return (
    <button
      type="button"
      onClick={panel?.onToggle}
      disabled={isAbsent}
      aria-expanded={isAbsent ? undefined : panel.isVisible}
      aria-controls={isAbsent ? undefined : panel.controlsId}
      className={cn(
        'flex size-8 items-center justify-center rounded',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:focus-visible:outline-orange-400',
        isAbsent
          ? 'cursor-not-allowed text-warm-400 dark:text-warm-600'
          : panel.isVisible
            ? 'bg-aubergine-700 text-white dark:bg-orange-500 dark:text-warm-950'
            : 'text-warm-700 hover:bg-warm-200 dark:text-warm-300 dark:hover:bg-warm-700',
      )}
    >
      {icon}
      <span className="sr-only">
        {isAbsent ? absentLabel : panel.isVisible ? hideLabel : showLabel}
      </span>
    </button>
  )
}
