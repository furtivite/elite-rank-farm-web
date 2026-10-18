'use client'

import cn from 'classnames'
import { fineForFaction, type UseCommanderStateResult } from '@/entities/commander-state'
import { arrivalStarNote, toggleStarMark, type ArrivalStar } from '@/entities/galaxy-data'
import {
  returnLegKey,
  type CommanderPosition,
  type JournalMission,
  type MissionStationGroup,
  type ReturnLeg,
  type StationFactsByStationId,
  type UseMissionStoreResult,
} from '@/entities/mission-store'
import { landingCheck, warnsAboutLanding } from '@/entities/mission-store/lib/landingWarning'
import { stationPlacement } from '@/features/farm-recommender'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { StarMarkToggle } from '@/shared/ui/StarMarkToggle'
import { TrashIcon } from '@/shared/ui/icons'
import { sameName } from '@/widgets/mission-basket/lib/sameName'
import { CopyNameButton } from '@/widgets/mission-basket/ui/CopyNameButton'
import { StationBadges } from '@/widgets/mission-basket/ui/StationBadges'
import { MissionCargoNote } from '@/widgets/mission-basket/ui/MissionCargoNote'
import { MissionReturnControls } from '@/widgets/mission-basket/ui/MissionReturnControls'

type BasketStationRowProps = {
  systemName: string
  station: MissionStationGroup
  position: CommanderPosition | null
  requiredPadSize: 'S' | 'M' | 'L' | null
  stationFacts: StationFactsByStationId
  starOf: (stationId: string | undefined) => ArrivalStar | undefined
  isNextTarget: boolean
  rankLabel: string | null
  duplicate: boolean
  fromJournal: boolean
  commander: UseCommanderStateResult
  store: UseMissionStoreResult
  isAdmin: boolean
  returnLegs: Readonly<Record<string, ReturnLeg>>
  journalMissions: readonly JournalMission[]
  cargoCapacityT: number | undefined
  onAddOne: (station: MissionStationGroup) => void
  onRemoveOne: (station: MissionStationGroup) => void
}

export function BasketStationRow({
  systemName,
  station,
  position,
  requiredPadSize,
  stationFacts,
  starOf,
  isNextTarget,
  rankLabel,
  duplicate,
  fromJournal,
  commander,
  store,
  isAdmin,
  returnLegs,
  journalMissions,
  cargoCapacityT,
  onAddOne,
  onRemoveOne,
}: BasketStationRowProps) {
  const t = useTranslation()

  const isCurrent =
    position?.stationName != null && sameName(station.stationName, position.stationName)

  const landing = landingCheck(
    station.stationId === undefined ? undefined : stationFacts.get(station.stationId)?.maxPadSize,
    requiredPadSize,
  )
  const warnsLanding = warnsAboutLanding(landing)

  const factStar =
    station.stationId === undefined ? undefined : stationFacts.get(station.stationId)?.star
  const starNote = arrivalStarNote(starOf(station.stationId), t)
  const dumpSaysOther = factStar?.isMain === false && factStar.source === 'dump'

  const arrivalLs =
    station.stationId === undefined
      ? undefined
      : stationFacts.get(station.stationId)?.distanceToArrivalLs

  const stationType =
    station.stationId === undefined ? undefined : stationFacts.get(station.stationId)?.type
  const isSurface = stationPlacement({ type: stationType }) === 'surface'

  const fine = fineForFaction(
    commander,
    station.stationId === undefined
      ? undefined
      : stationFacts.get(station.stationId)?.controllingFactionName,
  )

  return (
    <div
      key={station.key}
      className={cn(
        'flex flex-col gap-1',
        isCurrent
          ? 'rounded-md border border-aubergine-700 p-1 dark:border-orange-400'
          : warnsLanding
            ? 'rounded-md border border-danger-600 p-1 dark:border-danger-400'
            : isNextTarget
              ? 'rounded-md border border-dashed border-aubergine-700 p-1 dark:border-orange-400'
              : 'pl-2',
      )}
    >
      <StationBadges
        systemName={systemName}
        station={station}
        isCurrent={isCurrent}
        isNextTarget={isNextTarget}
        starNote={starNote}
        isSurface={isSurface}
        arrivalLs={arrivalLs}
        rankLabel={rankLabel}
        duplicate={duplicate}
        warnsLanding={warnsLanding}
        fine={fine}
        store={store}
      />

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onAddOne(station)}
          disabled={store.isFull}
          aria-label={t('basket.addMissionTo', { station: station.stationName })}
          title={t('basket.addMissionTo', { station: station.stationName })}
          className="min-h-8 px-2 text-xs"
        >
          +1
        </Button>
        {fromJournal ? null : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => onRemoveOne(station)}
            aria-label={t('basket.removeMissionAt', { station: station.stationName })}
            title={t('basket.removeMissionAt', { station: station.stationName })}
            className="min-h-8 px-2 text-xs"
          >
            −1
          </Button>
        )}
        <CopyNameButton what="basket.what.station" name={station.stationName} />
        <MissionReturnControls
          systemName={systemName}
          stationName={station.stationName}
          currentSystem={position?.systemName ?? null}
          currentStation={position?.stationName ?? null}
        />
        {fromJournal ? null : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => store.removeStation(systemName, station.stationName)}
            aria-label={t('basket.deleteStation', { station: station.stationName })}
            title={t('basket.deleteStation', { station: station.stationName })}
            className="min-h-8 min-w-8 px-2 text-xs"
          >
            <TrashIcon />
          </Button>
        )}
        {isAdmin && station.stationId !== undefined && !dumpSaysOther ? (
          <StarMarkToggle
            stationName={station.stationName}
            isMarked={starOf(station.stationId)?.source === 'manual'}
            onChange={(next) => {
              void toggleStarMark(station.stationId as string, next)
            }}
          />
        ) : null}
      </div>

      {(() => {
        const leg = returnLegs[returnLegKey(systemName, station.stationName)]
        return leg === undefined ? null : (
          <p className="text-warm-600 dark:text-warm-400">
            {leg.systemName} · {leg.stationName}
            <span className="ms-1 italic">— {t('basket.returnStation')}</span>
            {leg.extraRun === true ? (
              <span className="ms-1 rounded-sm border border-warm-300 px-1 not-italic dark:border-warm-600">
                {t('basket.returnExtraBadge')}
              </span>
            ) : null}
          </p>
        )
      })()}

      <MissionCargoNote
        missions={journalMissions.filter(
          (mission) =>
            mission.destinationSystem === systemName &&
            mission.destinationStation === station.stationName,
        )}
        cargoCapacityT={cargoCapacityT}
        returnLeg={returnLegs[returnLegKey(systemName, station.stationName)]}
      />

      {station.missions
        .filter((mission) => mission.note !== undefined)
        .map((mission) => (
          <p key={mission.id} className="text-warm-600 italic dark:text-warm-400">
            {mission.note}
          </p>
        ))}

      {fromJournal ? null : (
        <details>
          <summary className="cursor-pointer text-warm-600 dark:text-warm-400">
            {t('basket.markCompleted')}
          </summary>
          <ul className="mt-1 flex flex-col gap-1">
            {station.missions.map((mission, index) => (
              <li key={mission.id} className="flex items-center gap-2">
                <label className="flex min-h-11 items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={mission.completed === true}
                    onChange={(event) => store.setCompleted(mission.id, event.target.checked)}
                    className="size-4"
                  />
                  <span
                    className={cn(
                      mission.completed === true
                        ? 'text-warm-500 line-through dark:text-warm-400'
                        : '',
                    )}
                  >
                    {t('basket.missionNumber', { number: index + 1 })}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
