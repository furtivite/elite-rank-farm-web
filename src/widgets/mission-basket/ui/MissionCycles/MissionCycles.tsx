import {
  currentLegOfCycle,
  findMissionCycles,
  isOnEmptyReturn,
  type CycleLeg,
  type JournalMission,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'
import cn from 'classnames'

export function MissionCycles({
  missions,
  position,
}: {
  missions: readonly JournalMission[]
  position?: { systemName: string; stationName: string | null } | null
}) {
  const t = useTranslation()
  const cycles = findMissionCycles(missions)

  if (cycles.length === 0) {
    return null
  }

  const legLabel = (leg: CycleLeg): string => `${leg.from.stationName} → ${leg.to.stationName}`

  return (
    <section aria-labelledby="cycles-heading" className="flex flex-col gap-2">
      <h3 id="cycles-heading" className="text-sm font-semibold">
        {t('basket.cycle.heading')}
      </h3>
      <p className="text-warm-600 text-xs dark:text-warm-400">{t('basket.cycle.explain')}</p>

      <ul className="flex flex-col gap-2 text-xs">
        {cycles.map((cycle) => {
          const cyclePosition = {
            systemName: position?.systemName,
            stationName: position?.stationName,
          }
          const current = currentLegOfCycle(cycle, missions, cyclePosition)
          const onReturn = isOnEmptyReturn(cycle, missions, cyclePosition)
          const first = cycle.stations[0]
          const last = cycle.stations[cycle.stations.length - 1]
          const route = [...cycle.stations, first].map((station) => station.stationName).join(' → ')

          return (
            <li
              key={cycle.id}
              className="border-warm-300 dark:border-warm-600 flex flex-col gap-1 rounded-md border p-2"
              aria-label={t('basket.cycle.groupLabel', { route })}
            >
              <p className="font-semibold break-words">{route}</p>

              <ol className="flex flex-col gap-1">
                {cycle.legs.map((leg) => {
                  const isCurrent = !onReturn && current?.missionId === leg.missionId

                  return (
                    <li
                      key={leg.missionId}
                      className={cn(
                        'flex flex-wrap items-baseline gap-x-2',
                        isCurrent ? 'font-semibold' : '',
                      )}
                    >
                      <span className="break-words">{legLabel(leg)}</span>
                      {isCurrent ? (
                        <span className="text-aubergine-700 dark:text-orange-400">
                          {t('basket.cycle.current')}
                        </span>
                      ) : null}
                    </li>
                  )
                })}
                {cycle.emptyReturn && first !== undefined && last !== undefined ? (
                  <li
                    className={cn(
                      'flex flex-wrap items-baseline gap-x-2',
                      onReturn ? 'font-semibold' : '',
                    )}
                  >
                    <span className="break-words">{`${last.stationName} → ${first.stationName}`}</span>
                    <span className="text-warm-600 dark:text-warm-400">
                      {t('basket.cycle.emptyReturn')}
                    </span>
                    {onReturn ? (
                      <span className="text-aubergine-700 dark:text-orange-400">
                        {t('basket.cycle.current')}
                      </span>
                    ) : null}
                  </li>
                ) : null}
              </ol>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
