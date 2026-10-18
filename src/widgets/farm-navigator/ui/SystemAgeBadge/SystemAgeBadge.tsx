import cn from 'classnames'
import type { DataSource } from '@/entities/galaxy-data'
import { formatAge, freshness } from '@/shared/lib/freshness'
import { useTranslation } from '@/shared/lib/i18n'

type SystemAgeBadgeProps = {
  updatedAt: string | undefined
  now: number | null
  updatedBy?: DataSource
  className?: string
}

const SOURCE_KEYS = {
  journal: 'galaxy.dataAgeJournal',
  external: 'galaxy.dataAgeExternal',
  builder: 'galaxy.dataAgeBuilder',
} as const

export function SystemAgeBadge({ updatedAt, now, updatedBy, className }: SystemAgeBadgeProps) {
  const t = useTranslation()

  if (now === null || freshness(updatedAt, now) !== 'stale') {
    return null
  }

  const age = formatAge(updatedAt, now, t) ?? ''

  return (
    <span
      className={cn(
        'rounded-sm border border-caution-600 bg-caution-50 px-1 text-xs text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100',
        className,
      )}
    >
      {updatedBy === undefined ? t('galaxy.dataAge', { age }) : t(SOURCE_KEYS[updatedBy], { age })}
    </span>
  )
}
