'use client'

import cn from 'classnames'
import { useId, useSyncExternalStore } from 'react'
import {
  getReturnLegsSnapshot,
  getServerReturnLegsSnapshot,
  returnLegKey,
  subscribeToReturnLegs,
  writeReturnLegs,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'
import { BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS } from '@/shared/ui/Button'
import { RepeatIcon } from '@/shared/ui/icons'

export function MissionReturnControls({
  systemName,
  stationName,
  currentSystem,
  currentStation,
}: {
  systemName: string
  stationName: string
  currentSystem: string | null
  currentStation: string | null
}) {
  const t = useTranslation()
  const legs = useSyncExternalStore(
    subscribeToReturnLegs,
    getReturnLegsSnapshot,
    getServerReturnLegsSnapshot,
  )

  const key = returnLegKey(systemName, stationName)
  const leg = legs[key]
  const canMark = currentSystem !== null && currentStation !== null

  const toggle = () => {
    if (leg !== undefined) {
      const { [key]: _removed, ...rest } = legs
      writeReturnLegs(rest)
      return
    }
    if (canMark) {
      writeReturnLegs({
        ...legs,
        [key]: { systemName: currentSystem, stationName: currentStation },
      })
    }
  }

  const toggleExtraRun = () => {
    if (leg === undefined) {
      return
    }
    writeReturnLegs({
      ...legs,
      [key]: { ...leg, extraRun: leg.extraRun === true ? undefined : true },
    })
  }

  const shape = (isOn: boolean) =>
    cn(
      BUTTON_BASE_CLASS,
      'min-h-8 min-w-8 cursor-pointer px-2 text-xs',
      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
      'has-[:focus-visible]:outline-aubergine-700 dark:has-[:focus-visible]:outline-orange-400',
      isOn
        ? 'border border-aubergine-700 bg-aubergine-700 text-white dark:border-orange-500 dark:bg-orange-500 dark:text-warm-950'
        : BUTTON_VARIANT_CLASS.secondary,
    )

  const markLabel = t('basket.return', { station: stationName })
  const disabled = leg === undefined && !canMark
  const reasonId = useId()

  return (
    <span className="inline-flex items-center gap-2">
      <label
        className={cn(shape(leg !== undefined), disabled && 'cursor-not-allowed opacity-60')}
        title={markLabel}
      >
        <input
          type="checkbox"
          checked={leg !== undefined}
          disabled={disabled}
          onChange={toggle}
          aria-describedby={disabled ? reasonId : undefined}
          className="sr-only"
        />
        <span className="sr-only">{markLabel}</span>
        <RepeatIcon />
      </label>
      {disabled && (
        <span id={reasonId} className="text-xs text-warm-700 dark:text-warm-300">
          {t('basket.returnNeedsPosition')}
        </span>
      )}

      {leg === undefined ? null : (
        <label className={shape(leg.extraRun === true)} title={t('basket.returnExtraRun')}>
          <input
            type="checkbox"
            checked={leg.extraRun === true}
            onChange={toggleExtraRun}
            className="sr-only"
          />
          <span className="sr-only">{t('basket.returnExtraRun')}</span>
          <RepeatIcon />
          <span aria-hidden="true">+1</span>
        </label>
      )}
    </span>
  )
}
