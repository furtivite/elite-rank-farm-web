'use client'

import { useId, useSyncExternalStore } from 'react'
import cn from 'classnames'
import { useGalaxyRegionStatus } from '@/entities/galaxy-data'
import { useTranslation } from '@/shared/lib/i18n'
import {
  getJumpMultiplierSnapshot,
  getServerJumpMultiplierSnapshot,
  isMultiplierAvailable,
  JUMP_MULTIPLIERS,
  MAX_SEARCH_RADIUS_LY,
  reliableJumps,
  resolveSearchRadius,
  subscribeToJumpMultiplier,
  writeJumpMultiplier,
  type JumpMultiplier,
} from '@/shared/lib/searchRadius'

export function JumpMultiplierSection({ jumpRangeLy }: { jumpRangeLy: number | null }) {
  const t = useTranslation()
  const hintId = useId()
  const groupName = useId()
  const multiplier = useSyncExternalStore(
    subscribeToJumpMultiplier,
    getJumpMultiplierSnapshot,
    getServerJumpMultiplierSnapshot,
  )
  const region = useGalaxyRegionStatus('galaxy')
  const regionRadiusLy = region.meta?.radiusLy ?? null

  const area =
    jumpRangeLy === null || jumpRangeLy <= 0
      ? null
      : resolveSearchRadius(jumpRangeLy, multiplier, regionRadiusLy)

  return (
    <section className="flex flex-col gap-2">
      <fieldset
        aria-describedby={hintId}
        className="flex w-fit flex-row flex-wrap gap-x-3 rounded-md border border-warm-300 px-2 pb-1 dark:border-warm-600"
      >
        <legend className="px-1 text-sm font-semibold">{t('jumpMultiplier.heading')}</legend>

        {JUMP_MULTIPLIERS.map((value) => {
          const enabled = isMultiplierAvailable(jumpRangeLy, value, regionRadiusLy)
          const radiusLabel =
            jumpRangeLy === null || jumpRangeLy <= 0
              ? null
              : `${Math.round(jumpRangeLy * value)} ${t('unit.ly')}`

          return (
            <label
              key={value}
              className={cn(
                'flex min-h-11 items-center gap-1.5 text-sm font-medium',
                enabled
                  ? 'cursor-pointer text-warm-900 dark:text-warm-100'
                  : 'cursor-not-allowed text-warm-500 dark:text-warm-500',
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={value}
                checked={multiplier === value}
                disabled={!enabled}
                onChange={() => writeJumpMultiplier(value as JumpMultiplier)}
                className="size-4 accent-aubergine-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:accent-orange-500 dark:focus-visible:outline-orange-400"
              />
              <span className="flex flex-col leading-tight">
                <span>{`×${value}`}</span>
                {radiusLabel === null ? null : (
                  <span className="text-xs font-normal text-warm-600 dark:text-warm-400">
                    {radiusLabel}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </fieldset>

      <p id={hintId} className="flex flex-col gap-1 text-xs text-warm-600 dark:text-warm-400">
        <span>
          {t('jumpMultiplier.notJumps', {
            multiplier,
            jumps: t.plural('plural.jumps', reliableJumps(multiplier)),
          })}
        </span>
        {jumpRangeLy === null || jumpRangeLy <= 0 ? (
          <span>{t('jumpMultiplier.unknownRange')}</span>
        ) : null}
        {area?.clamped === true ? (
          <span>
            {t('jumpMultiplier.clamped', {
              requested: `${Math.round(area.requestedLy)} ${t('unit.ly')}`,
              radius: `${Math.round(area.radiusLy)} ${t('unit.ly')}`,
            })}
          </span>
        ) : null}
        <span>
          {t('jumpMultiplier.limit', {
            radius: `${MAX_SEARCH_RADIUS_LY} ${t('unit.ly')}`,
          })}
        </span>
      </p>
    </section>
  )
}
