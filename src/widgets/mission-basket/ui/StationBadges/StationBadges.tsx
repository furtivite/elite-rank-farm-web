'use client'

import { formatArrivalDistance, isDistantArrival } from '@/entities/galaxy-data'
import type { MissionStationGroup, UseMissionStoreResult } from '@/entities/mission-store'
import { formatDateTime } from '@/shared/lib/formatDateTime'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'

type Fine = { observedAt: string } | null

type StationBadgesProps = {
  systemName: string
  station: MissionStationGroup
  isCurrent: boolean
  isNextTarget: boolean
  starNote: string | null
  isSurface: boolean
  arrivalLs: number | undefined
  rankLabel: string | null
  duplicate: boolean
  warnsLanding: boolean
  fine: Fine
  store: UseMissionStoreResult
}

export function StationBadges({
  systemName,
  station,
  isCurrent,
  isNextTarget,
  starNote,
  isSurface,
  arrivalLs,
  rankLabel,
  duplicate,
  warnsLanding,
  fine,
  store,
}: StationBadgesProps) {
  const t = useTranslation()
  const farArrival = isDistantArrival(arrivalLs)

  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className="break-words">{station.stationName}</span>
      {isSurface ? (
        <span className="rounded-sm border border-warm-300 px-1 text-warm-700 dark:border-warm-600 dark:text-warm-300">
          {t('basket.surfaceStation')}
        </span>
      ) : null}
      {starNote === null ? null : (
        <span className="rounded-sm bg-caution-600 px-1 font-medium text-white dark:bg-caution-500 dark:text-warm-950">
          {starNote}
        </span>
      )}
      {arrivalLs === undefined ? null : farArrival ? (
        <span className="rounded-sm bg-caution-100 px-1 font-medium text-caution-900 dark:bg-caution-950 dark:text-caution-100">
          {t('basket.separateTrip', {
            distance: formatArrivalDistance(arrivalLs, t),
          })}
        </span>
      ) : (
        <span className="text-warm-600 dark:text-warm-400">
          {formatArrivalDistance(arrivalLs, t)}
        </span>
      )}
      {rankLabel === null ? null : (
        <span className="text-warm-600 dark:text-warm-400">
          <span aria-hidden="true">★ </span>
          {rankLabel}
        </span>
      )}
      {isCurrent ? (
        <span className="rounded-sm bg-aubergine-700 px-1 text-white dark:bg-orange-500 dark:text-warm-950">
          {t('basket.youAreHere')}
        </span>
      ) : null}
      {isNextTarget && !isCurrent ? (
        <span className="rounded-sm border border-aubergine-700 px-1 text-aubergine-900 dark:border-orange-400 dark:text-orange-200">
          {t('basket.next')}
        </span>
      ) : null}
      {duplicate ? (
        <span className="text-warm-600 dark:text-warm-400">{t('basket.looksLikeDuplicate')}</span>
      ) : null}
      {warnsLanding ? (
        <span className="rounded-sm bg-danger-600 px-1 text-white dark:bg-danger-400 dark:text-warm-950">
          {t('basket.wrongShip')}
        </span>
      ) : null}
      {fine === null ? null : (
        <span className="rounded-sm bg-danger-600 px-1 text-white dark:bg-danger-400 dark:text-warm-950">
          {t('basket.fineSince', {
            when: formatDateTime(Date.parse(fine.observedAt), t.language),
          })}
        </span>
      )}
      <span className="text-warm-600 dark:text-warm-400">
        {t.plural('plural.missions', station.missions.length)}
        {station.completedCount > 0
          ? t('basket.completedCount', { count: station.completedCount })
          : ''}
      </span>
      {station.completedCount > 0 ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => store.removeCompletedAtStation(systemName, station.stationName)}
          className="ml-auto min-h-8 px-2 text-xs"
        >
          {t('basket.removeCompleted')}
        </Button>
      ) : null}
    </div>
  )
}
