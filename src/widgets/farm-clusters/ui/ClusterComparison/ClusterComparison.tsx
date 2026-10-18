'use client'

import type { ClusterSummary, FarmSearchStatus } from '@/features/farm-recommender'
import { CLUSTER_TOP_STATIONS } from '@/features/farm-recommender'
import { Button } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'

export type ClusterComparisonProps = {
  status: FarmSearchStatus
  errorMessage: string | null
  summaries: readonly ClusterSummary[]
  selectedClusterId: string | null
  onChoose: (clusterId: string | null) => void
}

export function ClusterComparison({
  status,
  errorMessage,
  summaries,
  selectedClusterId,
  onChoose,
}: ClusterComparisonProps) {
  const t = useTranslation()

  const announcement =
    status === 'idle'
      ? ''
      : status === 'loading'
        ? t('clusters.comparing')
        : status === 'error'
          ? (errorMessage ?? t('clusters.comparisonFailed'))
          : status === 'empty'
            ? t('clusters.comparisonEmpty')
            : t('clusters.comparisonDone', {
                clusters: t.plural('plural.clusters', summaries.length),
              })

  return (
    <section aria-labelledby="cluster-comparison-heading" className="flex min-w-0 flex-col gap-2">
      <h2 id="cluster-comparison-heading" className="text-sm font-semibold">
        {t('clusters.comparisonHeading')}
      </h2>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div className="min-w-0 rounded-md border border-warm-300 dark:border-warm-700">
        {status === 'idle' ? (
          <p className="p-3 text-sm text-warm-600 dark:text-warm-400">
            {t('clusters.comparisonIdle', { submit: t('search.submit') })}
          </p>
        ) : status === 'loading' ? (
          <p className="p-3 text-sm text-warm-600 dark:text-warm-400">{t('clusters.comparing')}</p>
        ) : status === 'error' ? (
          <p className="p-3 text-sm text-danger-700 dark:text-danger-400">
            {errorMessage ?? t('clusters.comparisonFailed')}
          </p>
        ) : status === 'empty' ? (
          <p className="p-3 text-sm text-warm-600 dark:text-warm-400">
            {t('clusters.comparisonEmpty')}
          </p>
        ) : (
          <ul className="divide-y divide-warm-300 dark:divide-warm-700">
            {summaries.map((summary, index) => {
              const isCurrent = summary.clusterId === selectedClusterId

              return (
                <li
                  key={summary.clusterId ?? 'auto'}
                  className="flex flex-wrap items-center justify-between gap-2 p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {summary.name}
                      {index === 0 && summary.stationCount > 0 ? (
                        <span className="ms-2 text-xs font-normal text-warm-600 dark:text-warm-400">
                          {t('clusters.best')}
                        </span>
                      ) : null}
                      {isCurrent ? (
                        <span className="ms-2 text-xs font-normal text-warm-600 dark:text-warm-400">
                          {t('clusters.currentlySelected')}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-warm-600 dark:text-warm-400">
                      {summary.stationCount === 0
                        ? t('clusters.noStations')
                        : t('clusters.summary', {
                            systems: summary.systemCount,
                            stations: summary.stationCount,
                            top: CLUSTER_TOP_STATIONS,
                            topScore: Math.round(summary.topScore),
                            bestScore: Math.round(summary.bestScore),
                          })}
                    </p>
                  </div>

                  {isCurrent ? null : (
                    <Button
                      variant={index === 0 ? 'primary' : 'secondary'}
                      className="text-sm"
                      onClick={() => onChoose(summary.clusterId)}
                    >
                      {summary.clusterId === null
                        ? t('clusters.switchToAuto')
                        : t('clusters.stayHere')}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
