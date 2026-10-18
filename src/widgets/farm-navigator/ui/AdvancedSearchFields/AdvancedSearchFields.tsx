'use client'

import cn from 'classnames'
import {
  isPadOptionAvailable,
  PAD_SIZE_OPTIONS,
  type CompletedSides,
  type FarmMode,
  type PadSize,
} from '@/features/farm-recommender'
import { useId, type ReactNode } from 'react'
import { useTranslation } from '@/shared/lib/i18n'
import { Select } from '@/shared/ui/Select'
import {
  hintClassName,
  inputClassName,
  labelClassName,
  padOptionLabel,
} from '@/widgets/farm-navigator/lib/searchFormStyles'
import { SearchField } from '@/widgets/farm-navigator/ui/SearchField'

type AdvancedSearchFieldsProps = {
  mode: FarmMode
  onModeChange: (mode: FarmMode) => void
  completedSides: CompletedSides
  jumpRangeLy: string
  onJumpRangeChange: (value: string) => void
  padSize: PadSize | ''
  onPadSizeChange: (value: PadSize | '') => void
  requiredPadSize: PadSize | null
  summary: string
  isOpen: boolean
  onToggle: (open: boolean) => void
  isJumpRangeValid: boolean
  onManualEdit: () => void
  extra?: ReactNode
}

export function AdvancedSearchFields({
  mode,
  onModeChange,
  completedSides,
  jumpRangeLy,
  onJumpRangeChange,
  padSize,
  onPadSizeChange,
  requiredPadSize,
  summary,
  isOpen,
  onToggle,
  isJumpRangeValid,
  onManualEdit,
  extra,
}: AdvancedSearchFieldsProps) {
  const t = useTranslation()
  const farmModeName = useId()
  const completionNoteId = useId()
  const completionNote =
    completedSides.empire && completedSides.federal
      ? t('search.ranksCompleted.both')
      : completedSides.empire
        ? t('search.ranksCompleted.empire')
        : completedSides.federal
          ? t('search.ranksCompleted.federal')
          : null

  return (
    <details
      open={isOpen}
      onToggle={(event) => onToggle(event.currentTarget.open)}
      className="rounded-md border border-warm-300 sm:col-span-3 dark:border-warm-700"
    >
      <summary
        className={cn(
          'flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 text-sm font-medium',
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
        {t('search.advanced')}
        <span className="truncate text-xs font-normal text-warm-600 dark:text-warm-400">
          {summary}
        </span>
      </summary>

      <div className="grid gap-x-3 gap-y-2 p-2 pt-0 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <fieldset
            disabled={completedSides.empire && completedSides.federal}
            aria-describedby={completionNote === null ? undefined : completionNoteId}
            className="flex flex-col rounded-md border border-warm-300 px-2 pb-2 dark:border-warm-600"
          >
            <legend className={cn(labelClassName, 'mb-1.5 px-1')}>{t('search.farmMode')}</legend>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {(['empire', 'federal'] as const).map((value) => (
                <label
                  key={value}
                  className={cn(
                    'flex min-h-11 min-w-0 flex-1 basis-32 items-center gap-2 rounded-md border px-2 text-sm font-medium',
                    completedSides[value] ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    mode === value
                      ? 'border-aubergine-700 text-warm-900 dark:border-orange-500 dark:text-warm-100'
                      : 'border-warm-300 text-warm-700 dark:border-warm-600 dark:text-warm-300',
                  )}
                >
                  <input
                    type="radio"
                    name={farmModeName}
                    value={value}
                    checked={mode === value}
                    disabled={completedSides[value]}
                    onChange={() => onModeChange(value)}
                    className="size-4 accent-aubergine-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:accent-orange-500 dark:focus-visible:outline-orange-400"
                  />
                  {value === 'empire' ? 'Empire' : 'Federation'}
                </label>
              ))}
            </div>
          </fieldset>
          <p id={completionNoteId} className={hintClassName}>
            {completionNote}
          </p>
        </div>

        <SearchField
          label={t('search.jumpRange')}
          htmlFor="farm-jump-range"
          hintId="farm-jump-range-hint"
          hint={isJumpRangeValid ? undefined : t('search.jumpRangeHint')}
        >
          <input
            id="farm-jump-range"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={jumpRangeLy}
            onChange={(event) => {
              onJumpRangeChange(event.target.value)
              onManualEdit()
            }}
            aria-invalid={isJumpRangeValid ? undefined : true}
            aria-describedby={isJumpRangeValid ? undefined : 'farm-jump-range-hint'}
            className={inputClassName}
          />
        </SearchField>

        <SearchField
          label="Landing pad"
          htmlFor="farm-pad-size"
          hintId="farm-pad-size-hint"
          hint={
            requiredPadSize === null
              ? undefined
              : t('search.shipNeedsPad', { size: padOptionLabel(requiredPadSize, t) })
          }
        >
          <Select
            id="farm-pad-size"
            value={padSize}
            onChange={(event) => onPadSizeChange(event.target.value as PadSize | '')}
            className={inputClassName}
            aria-describedby={requiredPadSize === null ? undefined : 'farm-pad-size-hint'}
          >
            {PAD_SIZE_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
                disabled={!isPadOptionAvailable(option, requiredPadSize)}
              >
                {padOptionLabel(option, t)}
              </option>
            ))}
          </Select>
        </SearchField>
      </div>

      {extra === undefined ? null : (
        <div className="border-t border-warm-300 p-2 dark:border-warm-700">{extra}</div>
      )}
    </details>
  )
}
