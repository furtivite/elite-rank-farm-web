'use client'

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react'
import {
  fetchStarMarks,
  formatArrivalDistance,
  isDistantArrival,
  toggleStarMark,
  type StarMark,
} from '@/entities/galaxy-data'
import { useIsAdmin } from '@/entities/session'
import { useStationRatings } from '@/entities/station-rating'
import { formatDateTime } from '@/shared/lib/formatDateTime'
import { Button } from '@/shared/ui/Button'
import { PROGRESSIVE_START, progressiveSlice } from '@/shared/lib/progressiveList'
import {
  getOtherStarsPageSizeSnapshot,
  getServerOtherStarsPageSizeSnapshot,
  PAGE_SIZES,
  subscribeToOtherStarsPageSize,
  writeOtherStarsPageSize,
  type OtherStarsPageSize,
} from '@/shared/lib/otherStarsPageSize'
import { LoadingArea } from '@/shared/ui/Skeleton'
import { OtherStarSkeleton } from '@/widgets/other-stars/ui/OtherStarSkeleton'
import { useTranslation } from '@/shared/lib/i18n'

const fieldClassName =
  'min-h-11 w-full rounded-md border border-warm-500 bg-white px-3 text-base text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400'

type Status = 'loading' | 'success' | 'unauthorized' | 'error'

export function OtherStarsList() {
  const t = useTranslation()
  const [status, setStatus] = useState<Status>('loading')
  const [marks, setMarks] = useState<StarMark[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(PROGRESSIVE_START)
  const pageSizeId = useId()
  const pageSizeHintId = useId()
  const pageSize = useSyncExternalStore(
    subscribeToOtherStarsPageSize,
    getOtherStarsPageSizeSnapshot,
    getServerOtherStarsPageSizeSnapshot,
  )
  const isAdmin = useIsAdmin()
  const { ratings, setRating } = useStationRatings()

  useEffect(() => {
    let cancelled = false

    void fetchStarMarks().then((result) => {
      if (cancelled) {
        return
      }
      setStatus(result.status)
      if (result.status === 'success') {
        setMarks(result.marks)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (normalized === '') {
      return marks
    }

    return marks.filter(
      (mark) =>
        (mark.stationName ?? '').toLowerCase().includes(normalized) ||
        (mark.systemName ?? '').toLowerCase().includes(normalized),
    )
  }, [marks, query])

  const visible = progressiveSlice(
    filtered,
    page,
    `${query.trim().toLowerCase()}|${pageSize}`,
    pageSize,
  )

  const unmark = (mark: StarMark) => {
    setMarks((current) => current.filter((entry) => entry.stationId !== mark.stationId))
    void toggleStarMark(mark.stationId, false).then((ok) => {
      if (!ok) {
        setMarks((current) => [...current, mark])
      }
    })
  }

  return (
    <section aria-labelledby="other-stars-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 id="other-stars-heading" className="text-xl font-semibold">
          {t('otherStars.heading')}
        </h2>
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('otherStars.explanation')}</p>
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('otherStars.notInList')}</p>
      </div>

      {status === 'success' && marks.length > 0 ? (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t('otherStars.search')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('otherStars.searchPlaceholder')}
            className={fieldClassName}
          />
        </label>
      ) : null}

      {status === 'loading' ? (
        <LoadingArea isLoading>
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <OtherStarSkeleton key={index} />
            ))}
          </ul>
          <span className="sr-only">{t('otherStars.loading')}</span>
        </LoadingArea>
      ) : null}

      {status === 'unauthorized' ? (
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('otherStars.signInFirst')}</p>
      ) : null}

      {status === 'error' ? (
        <p role="alert" className="text-sm text-danger-700 dark:text-danger-400">
          {t('otherStars.failed')}
        </p>
      ) : null}

      {status === 'success' && marks.length === 0 ? (
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('otherStars.empty')}</p>
      ) : null}

      {status === 'success' && marks.length > 0 && filtered.length === 0 ? (
        <p className="text-sm text-warm-700 dark:text-warm-300">{t('otherStars.noMatches')}</p>
      ) : null}

      {filtered.length === 0 ? null : (
        <ul className="flex flex-col gap-2">
          {visible.shown.map((mark) => {
            const isBlocked = ratings[mark.stationId]?.rating === 'blocked'

            return (
              <li
                key={mark.stationId}
                className="flex flex-col gap-2 rounded-md border border-warm-300 p-3 dark:border-warm-700"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold break-words">
                    {mark.stationName ?? t('otherStars.stationOutsideDataset')}
                  </span>
                  <span className="text-warm-600 dark:text-warm-400">
                    {mark.systemName ?? t('otherStars.unknownSystem')}
                  </span>
                  {mark.bodyName === null ? null : (
                    <span className="text-warm-600 dark:text-warm-400">{mark.bodyName}</span>
                  )}
                  {mark.distanceToArrivalLs === null ? null : (
                    <span
                      className={
                        isDistantArrival(mark.distanceToArrivalLs)
                          ? 'rounded-sm bg-caution-100 px-1 font-medium text-caution-900 dark:bg-caution-950 dark:text-caution-100'
                          : 'text-warm-600 dark:text-warm-400'
                      }
                    >
                      {formatArrivalDistance(mark.distanceToArrivalLs, t)}
                    </span>
                  )}
                </div>

                <div className="text-xs text-warm-600 dark:text-warm-400">
                  {mark.fromDump ? (
                    <p>
                      {mark.dumpStarName === null
                        ? t('otherStars.fromDump')
                        : t('otherStars.fromDumpNamed', { star: mark.dumpStarName })}
                    </p>
                  ) : null}
                  {mark.markedBy === null ? null : (
                    <p>
                      {t('otherStars.markedBy', { who: mark.markedBy })}
                      {mark.markedAt === null
                        ? ''
                        : `, ${formatDateTime(Date.parse(mark.markedAt), t.language)}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {isAdmin ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => unmark(mark)}
                      className="min-h-8 px-2 text-xs"
                    >
                      {t('otherStars.clearForEveryone')}
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRating(mark.stationId, isBlocked ? undefined : 'blocked')}
                    className="min-h-8 px-2 text-xs"
                  >
                    {isBlocked ? t('otherStars.unhideForMe') : t('otherStars.hideForMe')}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {filtered.length === 0 ? null : (
        <div className="flex flex-col items-start gap-2">
          {visible.rest > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setPage(visible.next)}>
              {t('otherStars.showMore', { count: visible.nextChunk })}
            </Button>
          ) : null}

          <p aria-live="polite" className="text-xs text-warm-600 dark:text-warm-400">
            {t('otherStars.shownOf', {
              shown: visible.shown.length,
              total: filtered.length,
            })}
          </p>

          <label htmlFor={pageSizeId} className="text-sm font-medium">
            {t('otherStars.pageSize')}
          </label>
          <select
            id={pageSizeId}
            value={pageSize}
            aria-describedby={pageSizeHintId}
            onChange={(event) => {
              writeOtherStarsPageSize(Number(event.target.value) as OtherStarsPageSize)
              setPage(PROGRESSIVE_START)
            }}
            className="min-h-11 w-full max-w-40 rounded-md border border-warm-500 bg-white px-2 text-sm text-warm-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aubergine-700 dark:border-warm-500 dark:bg-warm-900 dark:text-warm-100 dark:focus-visible:outline-orange-400"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <p id={pageSizeHintId} className="text-xs text-warm-600 dark:text-warm-400">
            {t('otherStars.pageSizeHint')}
          </p>
        </div>
      )}
    </section>
  )
}
