import { closeTimeMinutes } from '@/entities/mission-store'
import type { RoutePlan as Plan } from '@/features/route-plan'
import { useTranslation } from '@/shared/lib/i18n'

export function RoutePlanBlock({ plan }: { plan: Plan | null }) {
  const t = useTranslation()

  if (plan === null || plan.stops.length < 2) {
    return null
  }

  const minutes = closeTimeMinutes({
    seconds: plan.seconds,
    unknownStations: 0,
    stations: 0,
    missions: 0,
  })

  return (
    <section aria-labelledby="route-heading" className="flex flex-col gap-1 text-xs">
      <h3 id="route-heading" className="text-sm font-semibold">
        {t('route.heading')}
      </h3>
      <p className="text-warm-600 dark:text-warm-400">{t('route.explain')}</p>

      {plan.returnLeg.systemName === '' ? null : (
        <p className="text-warm-600 dark:text-warm-400">
          {plan.returnLeg.stationName === null
            ? t('route.startSystem', { system: plan.returnLeg.systemName })
            : t('route.start', {
                system: plan.returnLeg.systemName,
                station: plan.returnLeg.stationName,
              })}
        </p>
      )}

      <ol className="ms-5 flex list-decimal flex-col gap-1">
        {plan.stops.map((stop) => (
          <li key={stop.systemKey} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold break-words">{stop.systemName}</span>
            <span className="text-warm-600 dark:text-warm-400">
              {[
                t.plural('plural.jumps', stop.jumps),
                t.plural('plural.missions', stop.missions),
                ...(stop.cargoT > 0 ? [`${stop.cargoT} ${t('unit.tons')}`] : []),
              ].join(' · ')}
            </span>
          </li>
        ))}

        <li className="flex flex-wrap items-baseline gap-x-2">
          {(plan.returnLeg.stationName ?? plan.returnLeg.systemName) === '' ? null : (
            <span className="font-semibold break-words">
              {plan.returnLeg.stationName ?? plan.returnLeg.systemName}
            </span>
          )}
          <span className="text-warm-600 dark:text-warm-400">
            {[t('route.back'), t.plural('plural.jumps', plan.returnLeg.jumps)].join(' · ')}
          </span>
        </li>
      </ol>

      <p>{t('route.total', { minutes })}</p>

      {plan.skipped.length > 0 ? (
        <p className="text-warm-600 dark:text-warm-400">
          {t('route.skipped', { systems: plan.skipped.join(', ') })}
        </p>
      ) : null}
    </section>
  )
}
