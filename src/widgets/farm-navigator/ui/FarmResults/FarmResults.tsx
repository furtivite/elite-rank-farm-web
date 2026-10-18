'use client'

import { useState } from 'react'
import type {
  FarmMode,
  FarmSearchStatus,
  ScoredStation,
  ScoredSystemGroup,
} from '@/features/farm-recommender'
import type { UseSystemRefreshResult } from '@/entities/galaxy-data'
import type { MissionAddResult, MissionTarget } from '@/entities/mission-store'
import type { FineNotice } from '@/entities/commander-state'
import type { StationRatingValue } from '@/entities/station-rating'
import { Button } from '@/shared/ui/Button'
import {
  PROGRESSIVE_PAGE_SIZE_SYSTEMS,
  PROGRESSIVE_START,
  progressiveSlice,
} from '@/shared/lib/progressiveList'
import { LoadingArea } from '@/shared/ui/Skeleton'
import { SystemRowSkeleton } from '@/widgets/farm-navigator/ui/SystemRowSkeleton/SystemRowSkeleton'
import { SystemRow } from '@/widgets/farm-navigator/ui/SystemRow/SystemRow'
import { useTranslation } from '@/shared/lib/i18n'

type FarmResultsProps = {
  status: FarmSearchStatus
  errorMessage: string | null
  groups: ScoredSystemGroup[]
  onSetRating: (
    stationId: string,
    value: StationRatingValue | undefined,
    systemId?: string,
    systemName?: string,
  ) => void
  onAddMission: (target: MissionTarget) => MissionAddResult
  refresh: UseSystemRefreshResult
  farmMode: FarmMode
  fineFor?: (station: ScoredStation) => FineNotice | null
  onLoadMore?: () => void
  pageSize?: number
}

export function FarmResults({
  status,
  errorMessage,
  groups,
  onSetRating,
  onAddMission,
  refresh,
  farmMode,
  fineFor,
  onLoadMore,
  pageSize = PROGRESSIVE_PAGE_SIZE_SYSTEMS,
}: FarmResultsProps) {
  const t = useTranslation()
  const totalStations = groups.reduce((sum, group) => sum + group.stations.length, 0)
  const [page, setPage] = useState(PROGRESSIVE_START)

  const pageKey = `${groups.length}:${groups[0]?.systemId ?? ''}:${groups.at(-1)?.systemId ?? ''}`
  const visible = progressiveSlice(groups, page, pageKey, pageSize)

  const isSearching = status === 'loading'
  const hasPreviousResults = groups.length > 0

  const announcement = (() => {
    if (status === 'idle') {
      return ''
    }
    if (isSearching) {
      return t('results.searching')
    }
    if (status === 'error') {
      return errorMessage ?? t('results.failed')
    }
    if (status === 'empty') {
      return t('results.empty')
    }
    if (groups.length === 0) {
      return t('results.filteredOut')
    }
    return t('results.done', {
      systems: t.plural('plural.systems', groups.length),
      stations: t.plural('plural.stations', totalStations),
    })
  })()

  return (
    <section aria-labelledby="farm-results-heading" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="farm-results-heading" className="text-sm font-semibold">
          {t('results.heading')}
        </h2>
        {status === 'success' ? (
          <p className="text-xs text-warm-600 dark:text-warm-400">
            {t('results.counts', { systems: groups.length, stations: totalStations })}
          </p>
        ) : null}
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div className="min-w-0 rounded-md border border-warm-300 dark:border-warm-700">
        {status === 'idle' ? (
          <p className="p-3 text-sm text-warm-600 dark:text-warm-400">
            {t('results.idle', { submit: t('search.submit') })}
          </p>
        ) : isSearching && hasPreviousResults ? (
          <LoadingArea isLoading>
            {groups.map((group) => (
              <SystemRow
                key={group.systemId}
                group={group}
                onSetRating={onSetRating}
                onAddMission={onAddMission}
                onRefresh={(systemId) => void refresh.refresh(systemId)}
                farmMode={farmMode}
                fineFor={fineFor}
                isRefreshing={refresh.pendingSystemId === group.systemId}
                refreshError={
                  refresh.errorSystemId === group.systemId ? refresh.errorMessage : null
                }
              />
            ))}
          </LoadingArea>
        ) : isSearching ? (
          <LoadingArea isLoading>
            {Array.from({ length: pageSize }, (_, index) => (
              <SystemRowSkeleton key={index} />
            ))}
          </LoadingArea>
        ) : status === 'error' ? (
          <p className="p-3 text-sm text-danger-700 dark:text-danger-400">
            {errorMessage ?? t('results.failed')}
          </p>
        ) : status === 'empty' ? (
          <p className="p-3 text-sm text-warm-600 dark:text-warm-400">{t('results.empty')}</p>
        ) : groups.length === 0 ? (
          <p className="p-3 text-sm text-warm-600 dark:text-warm-400">{t('results.filteredOut')}</p>
        ) : (
          <>
            {visible.shown.map((group) => (
              <SystemRow
                key={group.systemId}
                group={group}
                onSetRating={onSetRating}
                onAddMission={onAddMission}
                onRefresh={(systemId) => void refresh.refresh(systemId)}
                farmMode={farmMode}
                fineFor={fineFor}
                isRefreshing={refresh.pendingSystemId === group.systemId}
                refreshError={
                  refresh.errorSystemId === group.systemId ? refresh.errorMessage : null
                }
              />
            ))}
            {visible.rest > 0 || onLoadMore !== undefined ? (
              <div className="flex flex-col items-start gap-1 p-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (visible.rest > 0) {
                      setPage(visible.next)
                      return
                    }
                    onLoadMore?.()
                  }}
                >
                  {t('results.showMore', {
                    count: visible.rest > 0 ? visible.nextChunk : pageSize,
                  })}
                </Button>
                <p className="text-xs text-warm-600 dark:text-warm-400">
                  {t('results.shownOf', {
                    shown: visible.shown.length,
                    total: groups.length,
                  })}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
