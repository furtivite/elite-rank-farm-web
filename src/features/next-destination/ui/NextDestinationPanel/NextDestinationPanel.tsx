'use client'

import cn from 'classnames'
import { MISSION_WARN_FROM } from '@/entities/mission-store'
import type { CargoRunPlan } from '@/features/next-destination/lib/planCargoRun'
import type { RingStep } from '@/features/next-destination/lib/ringStep'
import type {
  NextDestination,
  NextDestinationReason,
} from '@/features/next-destination/lib/pickNextDestination'
import { usePinnedTarget } from '@/features/next-destination/model/usePinnedTarget'
import { Button } from '@/shared/ui/Button'
import { useTranslation } from '@/shared/lib/i18n'

type NextDestinationPanelProps = {
  usedSlots: number
  destination: NextDestination | null
  plan?: CargoRunPlan | null
  ring?: RingStep | null
}

export function NextDestinationPanel({
  usedSlots,
  destination,
  plan = null,
  ring = null,
}: NextDestinationPanelProps) {
  const t = useTranslation()
  const { pinned, pin, unpin } = usePinnedTarget()

  const freeingSlots = usedSlots >= MISSION_WARN_FROM

  if (plan !== null) {
    const { pickup, local, shuttle } = plan

    const targets = [
      {
        key: 'pickup',
        title: t('next.pickupTitle'),
        systemName: pickup.systemName,
        stationName: pickup.stationName,
        chips: [
          t('next.pickupRemaining', { amount: pickup.remaining }),
          ...(pickup.commodities.length === 0 ? [] : [pickup.commodities.join(', ')]),
          ...(pickup.missions > 1 ? [t('next.pickupMissions', { count: pickup.missions })] : []),
        ],
      },
      ...(local === null
        ? []
        : [
            {
              key: 'local',
              title: t('next.localTitle'),
              systemName: local.systemName,
              stationName: local.stationName,
              chips: [t('next.localMissions', { count: local.missions })],
            },
          ]),
    ]

    if (shuttle && local !== null) {
      targets.reverse()
    }

    return (
      <section
        aria-labelledby="next-destination-heading"
        className="rounded-md border border-warm-300 bg-warm-100 p-2 text-xs text-warm-900 dark:border-warm-700 dark:bg-warm-900 dark:text-warm-100"
      >
        <h3 id="next-destination-heading" className="text-xs font-semibold">
          {t('next.heading')}
        </h3>

        {shuttle ? (
          <p className="text-warm-700 dark:text-warm-300">{t('next.shuttleNote')}</p>
        ) : null}

        {targets.map((target) => (
          <article key={target.key} aria-label={target.title} className="mt-1">
            <p className="text-warm-700 dark:text-warm-300">{target.title}</p>
            <p className="text-sm font-semibold break-words">{target.systemName}</p>
            <p className="break-words">{target.stationName}</p>
            <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
              {target.chips.map((chip) => (
                <ReasonChip key={chip} reason={{ label: chip }} />
              ))}
            </ul>
          </article>
        ))}

        <p className="mt-1 text-warm-700 dark:text-warm-300">{t('next.pickupWhy')}</p>
        <RingBlock ring={ring} />
      </section>
    )
  }

  if (destination === null) {
    return ring === null ? null : (
      <section
        aria-labelledby="next-destination-heading"
        className="rounded-md border border-warm-300 bg-warm-100 p-2 text-xs text-warm-900 dark:border-warm-700 dark:bg-warm-900 dark:text-warm-100"
      >
        <h3 id="next-destination-heading" className="text-xs font-semibold">
          {t('next.heading')}
        </h3>
        <RingBlock ring={ring} />
      </section>
    )
  }

  const isPinnedStation = destination.isPinned && pinned?.stationKey === destination.stationKey

  return (
    <section
      aria-labelledby="next-destination-heading"
      className="rounded-md border border-warm-300 bg-warm-100 p-2 text-xs text-warm-900 dark:border-warm-700 dark:bg-warm-900 dark:text-warm-100"
    >
      <h3 id="next-destination-heading" className="text-xs font-semibold">
        {freeingSlots ? t('next.headingFreeingSlots') : t('next.heading')}
      </h3>

      {freeingSlots ? (
        <p className="text-warm-700 dark:text-warm-300">{t('next.freeingSlotsNote')}</p>
      ) : null}

      <p className="mt-1 text-sm font-semibold break-words">{destination.systemName}</p>
      <p className="break-words">
        {destination.bodyName === null ? null : (
          <span className="text-warm-600 dark:text-warm-400">{destination.bodyName} · </span>
        )}
        {destination.stationName}
      </p>

      <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
        {destination.reasons.map((reason) => (
          <ReasonChip key={reason.label} reason={reason} />
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap gap-2">
        {destination.isPinned ? (
          <Button
            type="button"
            variant="secondary"
            onClick={unpin}
            className="min-h-8 px-2 text-xs"
          >
            {t('next.unpin')}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => pin({ systemKey: destination.systemKey, stationKey: null })}
              className="min-h-8 px-2 text-xs"
            >
              {t('next.pinSystem')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                pin({ systemKey: destination.systemKey, stationKey: destination.stationKey })
              }
              className="min-h-8 px-2 text-xs"
            >
              {t('next.pinStation')}
            </Button>
          </>
        )}
      </div>

      {destination.isPinned && !isPinnedStation ? (
        <p className="mt-1 text-warm-600 dark:text-warm-400">{t('next.systemPinned')}</p>
      ) : null}

      <RingBlock ring={ring} />
    </section>
  )
}

function RingBlock({ ring }: { ring: RingStep | null }) {
  const t = useTranslation()
  if (ring === null) {
    return null
  }

  return (
    <article
      aria-label={t('next.ringTitle')}
      className="mt-2 border-t border-warm-300 pt-1 dark:border-warm-700"
    >
      <p className="text-warm-700 dark:text-warm-300">{t('next.ringTitle')}</p>
      <p className="font-semibold break-words">{ring.route.join(' → ')}</p>
      <p className="break-words">
        {t('next.ringNow', { from: ring.from.stationName, to: ring.to.stationName })}
        {ring.emptyReturn ? (
          <span className="text-warm-600 dark:text-warm-400">
            {' · '}
            {t('basket.cycle.emptyReturn')}
          </span>
        ) : null}
      </p>
      <p className="text-warm-600 break-words dark:text-warm-400">{ring.to.systemName}</p>
    </article>
  )
}

function ReasonChip({ reason }: { reason: NextDestinationReason }) {
  return (
    <li
      className={cn(
        'rounded-sm px-1',
        reason.caution === true
          ? 'border border-caution-600 bg-caution-50 text-caution-900 dark:border-caution-500 dark:bg-caution-950 dark:text-caution-100'
          : 'text-warm-600 dark:text-warm-400',
      )}
    >
      {reason.label}
    </li>
  )
}
