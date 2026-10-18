'use client'

import { useGalaxyRegionStatus } from '@/entities/galaxy-data'
import { formatAge, freshness, STALE_AFTER_DAYS } from '@/shared/lib/freshness'
import type { FarmRegionKey } from '@/features/farm-recommender'
import { useTranslation } from '@/shared/lib/i18n'
import { LoadingArea, SkeletonLines } from '@/shared/ui/Skeleton'
import { useNow } from '@/shared/lib/useNow'
import { formatDateTime } from '@/shared/lib/formatDateTime'
import { Button } from '@/shared/ui/Button'

type GalaxyRegionStatusProps = {
  activeRegion: FarmRegionKey
}

function RegionAge({ generatedAt }: { generatedAt: string }) {
  const t = useTranslation()
  const now = useNow()

  const age = now === null ? null : formatAge(generatedAt, now, t)
  const state = now === null ? 'unknown' : freshness(generatedAt, now)

  return (
    <>
      <p className="break-words">
        {t('region.updatedAt', {
          when: formatDateTime(new Date(generatedAt).getTime(), t.language),
        })}
        {age === null ? null : <span className="text-warm-600 dark:text-warm-400"> · {age}</span>}
      </p>
      {state === 'stale' ? (
        <p className="break-words text-caution-700 dark:text-caution-400">
          {t('region.stale', { days: STALE_AFTER_DAYS })}
        </p>
      ) : null}
    </>
  )
}

export function GalaxyRegionStatus({ activeRegion }: GalaxyRegionStatusProps) {
  const region = useGalaxyRegionStatus(activeRegion)
  const t = useTranslation()

  return (
    <section aria-labelledby="galaxy-region-status-heading" className="flex flex-col gap-2">
      <h2 id="galaxy-region-status-heading" className="text-sm font-semibold">
        Galaxy Data
      </h2>

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void region.refresh()
          }}
          disabled={region.status === 'loading'}
          aria-busy={region.status === 'loading'}
          className="min-h-9 w-full text-xs"
        >
          {t('region.check')}
        </Button>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex flex-col gap-1 rounded-md border border-warm-300 bg-warm-100 p-2 text-xs text-warm-900 dark:border-warm-600 dark:bg-warm-900 dark:text-warm-100"
      >
        <p className="font-semibold">{t('region.galaxy')}</p>

        {region.status === 'loading' || region.status === 'idle' ? (
          <LoadingArea isLoading className="flex flex-col gap-1 text-xs">
            <SkeletonLines count={3} label={t('region.loading')} />
          </LoadingArea>
        ) : region.status === 'success' && region.meta ? (
          <>
            <RegionAge generatedAt={region.meta.generatedAt} />
            <p>
              {t('region.counts', {
                systems: region.meta.systems,
                stations: region.meta.stations,
              })}
            </p>
            {region.meta.possiblyTruncated ? (
              <p className="break-words text-caution-700 dark:text-caution-400">
                {t('region.partialCoverage', { flag: '--max-systems' })}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="break-words">{region.errorMessage ?? t('region.failed')}</p>
            <p className="break-words text-warm-700 dark:text-warm-400">
              {t('region.notBuilt')}{' '}
              <code>npm run galaxy:from-dump -- --region {activeRegion}</code>
            </p>
          </>
        )}
      </div>
    </section>
  )
}
