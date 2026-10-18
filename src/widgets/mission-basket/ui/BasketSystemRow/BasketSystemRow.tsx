'use client'

import cn from 'classnames'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { ArrivalStar } from '@/entities/galaxy-data'
import {
  accumulationStatus,
  rankMissionLabel,
  rankSidesByStation,
  rankStationKey,
  type AccumulationThresholds,
  type CommanderPosition,
  type JournalMission,
  type MissionStationGroup,
  type MissionSystemGroup,
  type ReturnLeg,
  type StationFactsByStationId,
  type UseMissionStoreResult,
} from '@/entities/mission-store'
import { journalTargets, looksLikeDuplicate } from '@/entities/mission-store/lib/duplicateHint'
import { useTranslation } from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button'
import { TrashIcon } from '@/shared/ui/icons'
import { sameName } from '@/widgets/mission-basket/lib/sameName'
import { AccumulationBadge } from '@/widgets/mission-basket/ui/AccumulationBadge'
import { BasketStationRow } from '@/widgets/mission-basket/ui/BasketStationRow'
import { CopyNameButton } from '@/widgets/mission-basket/ui/CopyNameButton'
import { JumpsHint } from '@/widgets/mission-basket/ui/JumpsHint'
import { NextSystemToggle } from '@/widgets/mission-basket/ui/NextSystemToggle'
import { SystemCloseTime } from '@/widgets/mission-basket/ui/SystemCloseTime'
import { VisitOrderHint } from '@/widgets/mission-basket/ui/VisitOrderHint'

type BasketSystemRowProps = {
  system: MissionSystemGroup
  position: CommanderPosition | null
  requiredPadSize: 'S' | 'M' | 'L' | null
  stationFacts: StationFactsByStationId
  starOf: (stationId: string | undefined) => ArrivalStar | undefined
  thresholds: AccumulationThresholds
  suggestsAccumulating: boolean
  showJumps: boolean
  isPinnedSystem: boolean
  onPin: () => void
  onUnpin: () => void
  cargoRunActive: boolean
  nextStationKey: string | undefined
  rankSides: ReturnType<typeof rankSidesByStation> | null
  marksDuplicates: boolean
  fromJournal: boolean
  knownTargets: ReturnType<typeof journalTargets>
  commander: UseCommanderStateResult
  store: UseMissionStoreResult
  isAdmin: boolean
  returnLegs: Readonly<Record<string, ReturnLeg>>
  journalMissions: readonly JournalMission[]
  cargoCapacityT: number | undefined
  onAddOne: (station: MissionStationGroup) => void
  onRemoveOne: (station: MissionStationGroup) => void
}

export function BasketSystemRow({
  system,
  position,
  requiredPadSize,
  stationFacts,
  starOf,
  thresholds,
  suggestsAccumulating,
  showJumps,
  isPinnedSystem,
  onPin,
  onUnpin,
  cargoRunActive,
  nextStationKey,
  rankSides,
  marksDuplicates,
  fromJournal,
  knownTargets,
  commander,
  store,
  isAdmin,
  returnLegs,
  journalMissions,
  cargoCapacityT,
  onAddOne,
  onRemoveOne,
}: BasketSystemRowProps) {
  const t = useTranslation()

  const isCurrentSystem = position !== null && sameName(system.systemName, position.systemName)
  const hasOtherStar = system.bodies.some((body) =>
    body.stations.some((station) => starOf(station.stationId)?.isMain === false),
  )

  return (
    <li
      key={system.key}
      className={cn(
        'flex flex-col gap-1',
        isCurrentSystem ? 'rounded-md border border-aubergine-700 p-1 dark:border-orange-400' : '',
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-semibold break-words">{system.systemName}</span>
        <span className="text-warm-600 dark:text-warm-400">[{system.missionCount}]</span>
        {hasOtherStar ? (
          <span className="rounded border border-warm-400 px-1 text-warm-700 dark:border-warm-500 dark:text-warm-300">
            {t('basket.systemHasOtherStar')}
          </span>
        ) : null}
        {suggestsAccumulating && !isCurrentSystem ? (
          <AccumulationBadge
            status={accumulationStatus(system.missionCount - system.completedCount, thresholds)}
          />
        ) : null}
        {showJumps ? <JumpsHint jumps={system.jumps} /> : null}
        <SystemCloseTime system={system} stationFacts={stationFacts} />
        {isCurrentSystem ? (
          <span className="rounded-sm bg-aubergine-700 px-1 font-medium text-white dark:bg-orange-500 dark:text-warm-950">
            {t('basket.youAreHere')}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-warm-300 pb-1 dark:border-warm-700">
        <CopyNameButton what="basket.what.system" name={system.systemName} />
        <NextSystemToggle
          systemName={system.systemName}
          isNext={isPinnedSystem}
          onChange={(next) => (next ? onPin() : onUnpin())}
        />
        {system.completedCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => store.removeCompletedInSystem(system.systemName)}
            className="min-h-8 px-2 text-xs"
          >
            {t('basket.removeCompleted')}
          </Button>
        ) : null}

        {fromJournal ? null : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => store.removeSystem(system.systemName)}
            aria-label={t('basket.deleteAllInSystem', { system: system.systemName })}
            title={t('basket.deleteAllInSystem', { system: system.systemName })}
            className="ml-auto min-h-8 min-w-8 px-2 text-xs"
          >
            <TrashIcon />
          </Button>
        )}
      </div>

      {isCurrentSystem ? <VisitOrderHint system={system} stationFacts={stationFacts} /> : null}

      {system.bodies.map((body) => (
        <div key={body.key} className="flex flex-col gap-1 pl-2">
          {body.bodyName !== null ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-warm-600 dark:text-warm-400">{body.bodyName}</span>
              <CopyNameButton what="basket.what.body" name={body.bodyName} />
            </div>
          ) : null}

          {body.stations.map((station) => (
            <BasketStationRow
              key={station.key}
              systemName={system.systemName}
              station={station}
              position={position}
              requiredPadSize={requiredPadSize}
              stationFacts={stationFacts}
              starOf={starOf}
              isNextTarget={!cargoRunActive && nextStationKey === station.key}
              rankLabel={
                rankSides === null
                  ? null
                  : rankMissionLabel(
                      rankSides.get(rankStationKey(system.systemName, station.stationName)) ?? null,
                      t,
                    )
              }
              duplicate={
                marksDuplicates &&
                looksLikeDuplicate(knownTargets, system.systemName, station.stationName)
              }
              fromJournal={fromJournal}
              commander={commander}
              store={store}
              isAdmin={isAdmin}
              returnLegs={returnLegs}
              journalMissions={journalMissions}
              cargoCapacityT={cargoCapacityT}
              onAddOne={onAddOne}
              onRemoveOne={onRemoveOne}
            />
          ))}
        </div>
      ))}
    </li>
  )
}
