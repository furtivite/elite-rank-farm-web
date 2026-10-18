'use client'

import type { FarmMode, ResultsFilter, ResultsSort } from '@/features/farm-recommender'
import { useTranslation, type TranslationKey } from '@/shared/lib/i18n'
import { Select } from '@/shared/ui/Select'

const inputClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-2 pe-9 text-sm text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

const selectClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-2 text-sm text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

const labelClassName = 'min-h-4 text-xs font-medium text-warm-700 dark:text-warm-300'

const SORT_LABEL_KEYS: Record<ResultsSort, TranslationKey> = {
  score: 'results.sortByScore',
  'name-asc': 'results.sortByNameAsc',
  'name-desc': 'results.sortByNameDesc',
}

const SORT_OPTIONS: readonly ResultsSort[] = ['score', 'name-asc', 'name-desc']

type ResultsControlsProps = {
  filter: ResultsFilter
  onFilterChange: (filter: ResultsFilter) => void
  sort: ResultsSort
  onSortChange: (sort: ResultsSort) => void
  shownCount: number
  totalCount: number
  farmMode: FarmMode
}

export function ResultsControls({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  shownCount,
  totalCount,
  farmMode,
}: ResultsControlsProps) {
  const t = useTranslation()

  const fields = [
    {
      key: 'system' as const,
      id: 'results-filter-system',
      label: t('results.filterSystem'),
      placeholder: t('results.filterSystemPlaceholder'),
    },
    {
      key: 'station' as const,
      id: 'results-filter-station',
      label: t('results.filterStation'),
      placeholder: t('results.filterStationPlaceholder'),
    },
  ]

  return (
    <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label htmlFor={field.id} className={labelClassName}>
            {field.label}
          </label>
          <div className="relative">
            <input
              id={field.id}
              type="text"
              autoComplete="off"
              value={filter[field.key]}
              placeholder={field.placeholder}
              className={inputClassName}
              onChange={(event) => onFilterChange({ ...filter, [field.key]: event.target.value })}
            />
            {filter[field.key] === '' ? null : (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filter, [field.key]: '' })}
                aria-label={t('results.clearFilter', { field: field.label })}
                className="absolute end-1 top-1 flex size-9 items-center justify-center rounded-md text-lg leading-none text-warm-600 hover:bg-warm-100 active:bg-warm-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:text-warm-300 dark:hover:bg-warm-800 dark:active:bg-warm-700 dark:focus-visible:outline-orange-400"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="results-sort" className={labelClassName}>
          {t('results.sortHeading')}
        </label>
        <Select
          id="results-sort"
          value={sort}
          className={selectClassName}
          onChange={(event) => onSortChange(event.target.value as ResultsSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(SORT_LABEL_KEYS[option])}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={labelClassName} aria-hidden="true" />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filter.ownSideOnly}
            onChange={(event) => onFilterChange({ ...filter, ownSideOnly: event.target.checked })}
            aria-describedby="results-own-side-hint"
            className="size-4"
          />
          {farmMode === 'empire' ? t('results.empireOnly') : t('results.federationOnly')}
        </label>
        <p id="results-own-side-hint" className="text-xs text-warm-600 dark:text-warm-400">
          {t('results.unknownOwnerHidden')}
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="text-xs text-warm-600 sm:col-span-2 xl:col-span-3 dark:text-warm-400"
      >
        {shownCount === totalCount
          ? t('results.totalSystems', { total: totalCount })
          : t('results.shownSystems', { shown: shownCount, total: totalCount })}
      </p>
    </div>
  )
}
