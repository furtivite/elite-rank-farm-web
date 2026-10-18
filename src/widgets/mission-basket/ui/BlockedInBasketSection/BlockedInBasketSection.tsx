'use client'

import type { useBlockedBases } from '@/features/blocked-bases'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { LoadingArea } from '@/shared/ui/Skeleton'
import { BlockedInBasketSkeleton } from '@/widgets/mission-basket/ui/BlockedInBasketSkeleton'
import type { blockedInBasketSystems } from '@/widgets/mission-basket/lib/blockedInBasketSystems'

type BlockedInBasketSectionProps = {
  blocked: ReturnType<typeof useBlockedBases>
  blockedInBasket: ReturnType<typeof blockedInBasketSystems>
}

export function BlockedInBasketSection({ blocked, blockedInBasket }: BlockedInBasketSectionProps) {
  const t = useTranslation()

  return (
    <section aria-labelledby="blocked-heading" className="flex flex-col gap-2">
      <h2 id="blocked-heading" className="text-sm font-semibold">
        {t('nav.blockedBases')}
      </h2>

      {blocked.status === 'loading' ? (
        <LoadingArea isLoading>
          <ul className="flex flex-col gap-2 text-xs">
            <BlockedInBasketSkeleton />
          </ul>
          <span className="sr-only">{t('blocked.loading')}</span>
        </LoadingArea>
      ) : blocked.status === 'error' ? (
        <p className="text-xs text-danger-700 dark:text-danger-400">
          {blocked.errorMessage ?? t('blocked.failed')}
        </p>
      ) : blockedInBasket.length === 0 ? (
        <p className="text-xs text-warm-600 dark:text-warm-400">{t('basket.blockedEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-xs">
          {blockedInBasket.map((base) => (
            <li key={base.station.id} className="flex flex-col gap-1">
              <span className="break-words">
                {base.systemName} · {base.station.name}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => blocked.unblock(base.station.id)}
                className="min-h-8 self-start px-2 text-xs"
              >
                {t('basket.unblock')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
