'use client'

import cn from 'classnames'
import type { JumpEstimate } from '@/entities/galaxy-data'
import { useTranslation, type Translate } from '@/shared/lib/i18n'

function jumpsLabel(count: number, t: Translate, source: JumpEstimate['source']): string {
  const jumps = t.plural('plural.jumpsAtLeast', count)
  return source === 'graph'
    ? t('basket.aboutJumps', { jumps })
    : t('basket.atLeastJumps', { jumps })
}

export function JumpsHint({ jumps }: { jumps: JumpEstimate | null }) {
  const t = useTranslation()

  if (jumps === null) {
    return (
      <span className="text-warm-600 dark:text-warm-400">
        {t('basket.unknownDistance')}
        {t('basket.notInDataset')}
      </span>
    )
  }

  if (jumps.minJumps === 0) {
    return null
  }

  return (
    <span>
      <span
        className={cn(
          'rounded-sm px-1',
          jumps.isFar
            ? 'border border-caution-600 bg-caution-50 text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100'
            : 'text-warm-600 dark:text-warm-400',
        )}
      >
        {jumpsLabel(jumps.minJumps, t, jumps.source)} · {jumps.distanceLy.toFixed(1)}
        {'\u00a0'}
        {t('unit.ly')}
      </span>
      <span className="text-warm-600 dark:text-warm-400">
        {jumps.source === 'graph' ? t('basket.routeByMap') : t('basket.routeIsShortest')}
      </span>
    </span>
  )
}
