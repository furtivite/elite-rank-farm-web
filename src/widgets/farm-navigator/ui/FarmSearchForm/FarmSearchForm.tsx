'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import type { CommanderState } from '@/entities/commander-state'
import {
  NO_COMPLETED_SIDES,
  type CompletedSides,
  type FarmMode,
  type FarmSearchParams,
  type PadSize,
} from '@/features/farm-recommender'
import { Button } from '@/shared/ui/Button'
import {
  hintClassName,
  inputClassName,
  padOptionLabel,
} from '@/widgets/farm-navigator/lib/searchFormStyles'
import { AdvancedSearchFields } from '@/widgets/farm-navigator/ui/AdvancedSearchFields'
import { SearchField } from '@/widgets/farm-navigator/ui/SearchField'
import { useTranslation } from '@/shared/lib/i18n'
import {
  getJumpMultiplierSnapshot,
  getServerJumpMultiplierSnapshot,
  subscribeToJumpMultiplier,
} from '@/shared/lib/searchRadius'

type FarmSearchFormProps = {
  onSearch: (params: FarmSearchParams) => void
  isLoading: boolean
  commanderState: CommanderState | null
  mode: FarmMode
  onModeChange: (mode: FarmMode) => void
  completedSides?: CompletedSides
  submitLabel?: string
  advancedExtra?: ReactNode
  clusterSummary?: string
}

function roundJumpRange(value: number): number {
  return Math.max(1, Math.floor(value))
}

export function FarmSearchForm({
  onSearch,
  isLoading,
  commanderState,
  mode,
  onModeChange,
  completedSides = NO_COMPLETED_SIDES,
  submitLabel,
  advancedExtra,
  clusterSummary,
}: FarmSearchFormProps) {
  const t = useTranslation()
  const jumpMultiplier = useSyncExternalStore(
    subscribeToJumpMultiplier,
    getJumpMultiplierSnapshot,
    getServerJumpMultiplierSnapshot,
  )
  const [currentSystem, setCurrentSystem] = useState('')
  const [jumpRangeLy, setJumpRangeLy] = useState('40')
  const [padSize, setPadSize] = useState<PadSize | ''>('')
  const [excludeSurface, setExcludeSurface] = useState(false)
  const [excludeSecondaryStar, setExcludeSecondaryStar] = useState(false)
  const [usesCommanderPosition, setUsesCommanderPosition] = useState(false)
  const [appliedCommanderKey, setAppliedCommanderKey] = useState<string | null>(null)

  const requiredPadSize = commanderState?.requiredPadSize ?? null
  const commanderKey =
    commanderState === null
      ? null
      : `${commanderState.currentSystem.name}|${commanderState.jumpRangeLy}|${requiredPadSize ?? '?'}`

  if (commanderState !== null && commanderKey !== appliedCommanderKey) {
    setAppliedCommanderKey(commanderKey)
    setCurrentSystem(commanderState.currentSystem.name)
    setJumpRangeLy(String(roundJumpRange(commanderState.jumpRangeLy)))
    setPadSize(requiredPadSize ?? '')
    setUsesCommanderPosition(true)
  }

  const jumpRangeValue = Number(jumpRangeLy)
  const isJumpRangeValid = Number.isFinite(jumpRangeValue) && jumpRangeValue > 0
  const canSubmit = currentSystem.trim() !== '' && isJumpRangeValid

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const isAdvancedVisible = isAdvancedOpen || !isJumpRangeValid

  const advancedSummary = [
    mode === 'empire' ? 'Empire' : 'Federation',
    jumpMultiplier === 1
      ? `${jumpRangeLy || '?'}\u00a0${t('unit.ly')}`
      : `${jumpRangeLy || '?'}\u00a0×\u00a0${jumpMultiplier}\u00a0${t('unit.ly')}`,
    t('search.padSummary', { size: padOptionLabel(padSize, t).toLowerCase() }),
    ...(clusterSummary === undefined ? [] : [clusterSummary]),
  ].join(' · ')

  return (
    <form
      className="grid gap-x-3 gap-y-3 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!canSubmit) {
          return
        }

        onSearch({
          mode,
          currentSystem:
            usesCommanderPosition && commanderState !== null
              ? {
                  kind: 'coords',
                  name: commanderState.currentSystem.name,
                  x: commanderState.currentSystem.x,
                  y: commanderState.currentSystem.y,
                  z: commanderState.currentSystem.z,
                }
              : { kind: 'name', name: currentSystem.trim() },
          jumpRangeLy: roundJumpRange(jumpRangeValue),
          jumpMultiplier,
          padSize: padSize === '' ? undefined : padSize,
          excludeSurface,
          excludeSecondaryStar,
        })
      }}
    >
      <SearchField
        label={t('search.currentSystem')}
        htmlFor="farm-current-system"
        hint={usesCommanderPosition ? t('search.positionFromAgent') : undefined}
        className="sm:col-span-3"
      >
        <input
          id="farm-current-system"
          type="text"
          autoComplete="off"
          value={currentSystem}
          onChange={(event) => {
            setCurrentSystem(event.target.value)
            setUsesCommanderPosition(false)
          }}
          placeholder={t('search.systemPlaceholder')}
          className={inputClassName}
        />
      </SearchField>

      <AdvancedSearchFields
        mode={mode}
        onModeChange={onModeChange}
        completedSides={completedSides}
        jumpRangeLy={jumpRangeLy}
        onJumpRangeChange={setJumpRangeLy}
        padSize={padSize}
        onPadSizeChange={setPadSize}
        isOpen={isAdvancedVisible}
        onToggle={setIsAdvancedOpen}
        isJumpRangeValid={isJumpRangeValid}
        requiredPadSize={requiredPadSize}
        summary={advancedSummary}
        onManualEdit={() => setUsesCommanderPosition(false)}
        extra={advancedExtra}
      />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:col-span-3 sm:grid-cols-3">
        <div className="col-start-1 sm:col-start-2">
          <label className="flex min-h-11 items-start gap-2 py-3 text-sm">
            <input
              type="checkbox"
              checked={excludeSurface}
              onChange={(event) => setExcludeSurface(event.target.checked)}
              aria-describedby="farm-exclude-surface-hint"
              className="mt-0.5 size-4 shrink-0"
            />
            {t('search.orbitalOnly')}
          </label>
          <p id="farm-exclude-surface-hint" className={hintClassName}>
            {t('search.orbitalOnlyHint')}
          </p>
        </div>

        <div className="col-start-2 sm:col-start-3">
          <label className="flex min-h-11 items-start gap-2 py-3 text-sm">
            <input
              type="checkbox"
              checked={excludeSecondaryStar}
              onChange={(event) => setExcludeSecondaryStar(event.target.checked)}
              aria-describedby="farm-exclude-secondary-star-hint"
              className="mt-0.5 size-4 shrink-0"
            />
            {t('search.noOtherStars')}
          </label>
          <p id="farm-exclude-secondary-star-hint" className={hintClassName}>
            {t('search.noOtherStarsHint')}
          </p>
        </div>
      </div>

      <div className="sm:col-span-3 sm:flex sm:justify-end">
        <Button
          type="submit"
          disabled={!canSubmit || isLoading}
          aria-busy={isLoading}
          className="w-full sm:w-1/3"
        >
          {isLoading ? t('search.searching') : (submitLabel ?? t('search.submit'))}
        </Button>
      </div>
    </form>
  )
}
