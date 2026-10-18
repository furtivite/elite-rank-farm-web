'use client'

import { useMemo, useState } from 'react'
import { useBlockedBases } from '@/features/blocked-bases'
import { BlockedBaseCard } from '@/widgets/blocked-bases/ui/BlockedBaseCard/BlockedBaseCard'
import { LoadingArea } from '@/shared/ui/Skeleton'
import { BlockedBaseCardSkeleton } from '@/widgets/blocked-bases/ui/BlockedBaseCardSkeleton/BlockedBaseCardSkeleton'
import { Select } from '@/shared/ui/Select'
import { useTranslation } from '@/shared/lib/i18n'

const ALLEGIANCE_OPTIONS = ['Empire', 'Federation', 'Alliance', 'Independent', 'Other'] as const
type AllegianceFilter = '' | (typeof ALLEGIANCE_OPTIONS)[number]

const fieldClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

export function BlockedBasesList() {
  const t = useTranslation()
  const { status, errorMessage, bases, unblock, setRating, setNote } = useBlockedBases()
  const [query, setQuery] = useState('')
  const [allegiance, setAllegiance] = useState<AllegianceFilter>('')

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return bases.filter((base) => {
      if (allegiance !== '' && base.station.controllingFaction?.allegiance !== allegiance) {
        return false
      }

      if (normalizedQuery === '') {
        return true
      }

      return (
        base.station.name.toLowerCase().includes(normalizedQuery) ||
        base.systemName.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [bases, query, allegiance])

  const announcement =
    status === 'loading'
      ? t('blocked.loading')
      : status === 'error'
        ? (errorMessage ?? t('blocked.failed'))
        : bases.length === 0
          ? t('blocked.none')
          : filtered.length === 0
            ? t('blocked.noMatches')
            : t('blocked.announce', { bases: t.plural('plural.bases', filtered.length) })

  return (
    <section aria-labelledby="blocked-bases-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 id="blocked-bases-heading" className="text-xl font-semibold">
          {t('nav.blockedBases')}
        </h2>
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('blocked.explanation')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">{t('blocked.search')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('blocked.searchPlaceholder')}
            className={fieldClassName}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t('blocked.allegiance')}</span>
          <Select
            value={allegiance}
            onChange={(event) => setAllegiance(event.target.value as AllegianceFilter)}
            className={fieldClassName}
          >
            <option value="">{t('blocked.anyPad')}</option>
            {ALLEGIANCE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-col gap-3">
        {status === 'loading' ? (
          <LoadingArea isLoading className="flex flex-col gap-3">
            <BlockedBaseCardSkeleton />
            <BlockedBaseCardSkeleton />
          </LoadingArea>
        ) : status === 'error' ? (
          <p className="text-danger-700 dark:text-danger-400">
            {errorMessage ?? t('blocked.failed')}
          </p>
        ) : bases.length === 0 ? (
          <p className="text-warm-700 dark:text-warm-300">{t('blocked.none')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-warm-700 dark:text-warm-300">{t('blocked.noMatches')}</p>
        ) : (
          filtered.map((base) => (
            <BlockedBaseCard
              key={base.station.id}
              base={base}
              onUnblock={unblock}
              onSetRating={setRating}
              onSaveNote={setNote}
            />
          ))
        )}
      </div>
    </section>
  )
}
