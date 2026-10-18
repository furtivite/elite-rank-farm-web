'use client'

import { useMemo, useState } from 'react'
import {
  groupStationsByBody,
  type FarmMode,
  type ScoredStation,
  type ScoredSystemGroup,
} from '@/features/farm-recommender'
import type { MissionAddResult, MissionTarget } from '@/entities/mission-store'
import type { FineNotice } from '@/entities/commander-state'
import type { StationRatingValue } from '@/entities/station-rating'
import { BodyRow } from '@/widgets/farm-navigator/ui/BodyRow/BodyRow'
import { StationRow } from '@/widgets/farm-navigator/ui/StationRow/StationRow'
import { SystemAgeBadge } from '@/widgets/farm-navigator/ui/SystemAgeBadge/SystemAgeBadge'
import { useNow } from '@/shared/lib/useNow'
import { useTranslation } from '@/shared/lib/i18n'

type SystemRowProps = {
  group: ScoredSystemGroup
  onSetRating: (
    stationId: string,
    value: StationRatingValue | undefined,
    systemId?: string,
    systemName?: string,
  ) => void
  onAddMission: (target: MissionTarget) => MissionAddResult
  onRefresh: (systemId: string) => void
  isRefreshing: boolean
  refreshError: string | null
  farmMode: FarmMode
  fineFor?: (station: ScoredStation) => FineNotice | null
}

export function SystemRow({
  group,
  onSetRating,
  onAddMission,
  onRefresh,
  isRefreshing,
  refreshError,
  farmMode,
  fineFor = () => null,
}: SystemRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslation()
  const now = useNow()
  const bodies = useMemo(() => groupStationsByBody(group.stations), [group.stations])
  const orbital = bodies.find((body) => body.bodyName === null)
  const namedBodies = bodies.filter((body) => body.bodyName !== null)

  return (
    <section className="border-b border-warm-300 dark:border-warm-700">
      <div className="flex items-baseline">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 flex-col gap-1 px-2 py-2 text-left text-sm transition-colors hover:bg-warm-100 active:bg-warm-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:hover:bg-warm-800 dark:active:bg-warm-700 dark:focus-visible:outline-orange-400"
        >
          <span className="flex w-full items-baseline gap-2">
            <span aria-hidden="true" className="w-3 text-warm-500 dark:text-warm-400">
              {isOpen ? '▾' : '▸'}
            </span>
            <span className="font-semibold">{group.systemName}</span>
            <span className="text-xs text-warm-600 dark:text-warm-400">
              {`${group.distanceLy.toFixed(1)}\u00a0${t('unit.ly')}`} ·{' '}
              {t('results.stationsShort', { count: group.stations.length })}
              {namedBodies.length > 0
                ? ` · ${t('results.bodiesShort', { count: namedBodies.length })}`
                : ''}
            </span>

            {group.missionCount > 0 ? (
              <span className="rounded bg-warm-200 px-1.5 text-xs font-medium dark:bg-warm-700">
                {t('results.missionCount', { count: group.missionCount })}
              </span>
            ) : null}
            <span className="ml-auto text-xs font-semibold">
              {t('results.bestScore', { score: group.bestScore })}
            </span>
          </span>

          {group.hiddenNoBoard !== undefined && group.hiddenNoBoard > 0 ? (
            <span className="ms-5 self-start text-xs text-warm-600 dark:text-warm-400">
              {t('results.hiddenNoBoard', { count: group.hiddenNoBoard })}
            </span>
          ) : null}

          <SystemAgeBadge
            updatedAt={group.updatedAt}
            updatedBy={group.updatedBy}
            now={now}
            className="ms-5 self-start"
          />
        </button>

        <button
          type="button"
          onClick={() => onRefresh(group.systemId)}
          disabled={isRefreshing}
          aria-label={t('galaxy.refreshSystem', { system: group.systemName })}
          className="shrink-0 px-2 py-2 text-xs text-warm-600 underline transition-colors hover:text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 disabled:no-underline disabled:opacity-60 dark:text-warm-400 dark:hover:text-warm-100 dark:focus-visible:outline-orange-400"
        >
          {isRefreshing ? t('galaxy.refreshing') : t('galaxy.refresh')}
        </button>
      </div>

      {refreshError === null ? null : (
        <p className="px-2 pb-2 text-xs text-danger-700 dark:text-danger-400">{refreshError}</p>
      )}

      {isOpen ? (
        <div className="pl-3">
          {orbital?.stations.map((scored) => (
            <StationRow
              key={scored.station.id}
              systemName={group.systemName}
              systemId={group.systemId}
              scored={scored}
              onSetRating={onSetRating}
              onAddMission={onAddMission}
              farmMode={farmMode}
              fine={fineFor(scored)}
            />
          ))}

          {namedBodies.map((body) => (
            <BodyRow
              key={body.bodyName}
              systemName={group.systemName}
              systemId={group.systemId}
              group={body}
              onSetRating={onSetRating}
              onAddMission={onAddMission}
              farmMode={farmMode}
              fineFor={fineFor}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
