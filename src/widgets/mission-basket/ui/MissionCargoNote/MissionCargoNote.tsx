import {
  awaitsCargo,
  cargoProgress,
  cargoSource,
  type JournalMission,
  type ReturnLeg,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'
import { RepeatIcon } from '@/shared/ui/icons'

export function MissionCargoNote({
  missions,
  cargoCapacityT,
  returnLeg,
}: {
  missions: readonly JournalMission[]
  cargoCapacityT: number | undefined
  returnLeg?: ReturnLeg
}) {
  const t = useTranslation()
  const withCargo = missions.filter((mission) => mission.cargo !== undefined)

  if (withCargo.length === 0) {
    return null
  }

  return (
    <>
      {withCargo.map((mission) => {
        const progress = cargoProgress(mission.cargo!, cargoCapacityT)

        if (progress.remaining === 0) {
          return null
        }

        const parts = [
          `${t('basket.cargo.inHold', { amount: progress.inHold })} | ${t(
            'basket.cargo.remaining',
            { remaining: progress.toCollect },
          )}\u00a0${t('unit.tons')}`,
        ]

        const source = cargoSource(mission)
        if (source !== null) {
          const allCollected = progress.inHold >= progress.remaining
          parts.push(
            t(allCollected ? 'basket.cargo.collectedAt' : 'basket.cargo.source', {
              system: source.systemName,
              station: source.stationName,
            }),
          )
        }

        const returnsToSource =
          returnLeg !== undefined &&
          source !== null &&
          returnLeg.stationName === source.stationName &&
          returnLeg.systemName === source.systemName

        if (awaitsCargo(mission.cargo)) {
          parts.push(t('basket.cargo.awaiting'))
        }

        if (progress.lost > 0) {
          parts.push(t('basket.cargo.lost', { amount: progress.lost }))
        }

        const runsNote =
          progress.runsLeft === null
            ? t('basket.cargo.noHold')
            : progress.runsLeft > 1
              ? t('basket.cargo.runsLeft', {
                  runs: t.plural('plural.runs', progress.runsLeft),
                  capacity: cargoCapacityT ?? 0,
                })
              : null

        return (
          <p key={mission.missionId} className="text-warm-600 dark:text-warm-400">
            {mission.cargo?.commodityLocalised ?? mission.cargo?.commodity ?? null}
            {mission.cargo?.commodityLocalised === undefined &&
            mission.cargo?.commodity === undefined
              ? null
              : ' — '}
            {parts.join(' · ')}
            {returnsToSource ? (
              <span className="ms-1 inline-flex items-center gap-1">
                <RepeatIcon />
                {t('basket.cargo.returnHere')}
              </span>
            ) : null}
            {runsNote === null ? null : (
              <span className="block text-xs text-warm-500 dark:text-warm-500">{runsNote}</span>
            )}
          </p>
        )
      })}
    </>
  )
}
