'use client'

import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { ArrivalStar } from '@/entities/galaxy-data'
import {
  rankSidesByStation,
  type AccumulationThresholds,
  type CommanderPosition,
  type JournalMission,
  type MissionStationGroup,
  type MissionSystemGroup,
  type ReturnLeg,
  type StationFactsByStationId,
  type UseMissionStoreResult,
} from '@/entities/mission-store'
import type { journalTargets } from '@/entities/mission-store/lib/duplicateHint'
import { BasketSystemRow } from '@/widgets/mission-basket/ui/BasketSystemRow'

type PinnedTarget = { systemKey: string; stationKey: string | null } | null

type BasketSystemListProps = {
  groups: readonly MissionSystemGroup[]
  rankSides: ReturnType<typeof rankSidesByStation> | null
  marksDuplicates: boolean
  fromJournal: boolean
  knownTargets: ReturnType<typeof journalTargets>
  position: CommanderPosition | null
  requiredPadSize: 'S' | 'M' | 'L' | null
  stationFacts: StationFactsByStationId
  starOf: (stationId: string | undefined) => ArrivalStar | undefined
  thresholds: AccumulationThresholds
  suggestsAccumulating: boolean
  showJumps: boolean
  pinned: PinnedTarget
  onPin: (target: { systemKey: string; stationKey: string | null }) => void
  onUnpin: () => void
  cargoRunActive: boolean
  nextStationKey: string | undefined
  commander: UseCommanderStateResult
  store: UseMissionStoreResult
  isAdmin: boolean
  returnLegs: Readonly<Record<string, ReturnLeg>>
  journalMissions: readonly JournalMission[]
  cargoCapacityT: number | undefined
  onAddOne: (station: MissionStationGroup) => void
  onRemoveOne: (station: MissionStationGroup) => void
  onFreeze: () => void
  onUnfreezeIfLeft: (event: React.FocusEvent | React.PointerEvent) => void
}

export function BasketSystemList({
  groups,
  rankSides,
  marksDuplicates,
  fromJournal,
  knownTargets,
  position,
  requiredPadSize,
  stationFacts,
  starOf,
  thresholds,
  suggestsAccumulating,
  showJumps,
  pinned,
  onPin,
  onUnpin,
  cargoRunActive,
  nextStationKey,
  commander,
  store,
  isAdmin,
  returnLegs,
  journalMissions,
  cargoCapacityT,
  onAddOne,
  onRemoveOne,
  onFreeze,
  onUnfreezeIfLeft,
}: BasketSystemListProps) {
  return (
    <ul
      className="flex flex-col gap-3 text-xs"
      onPointerEnter={onFreeze}
      onPointerLeave={onUnfreezeIfLeft}
      onFocusCapture={onFreeze}
      onBlurCapture={onUnfreezeIfLeft}
    >
      {groups.map((system) => (
        <BasketSystemRow
          key={system.key}
          system={system}
          position={position}
          requiredPadSize={requiredPadSize}
          stationFacts={stationFacts}
          starOf={starOf}
          thresholds={thresholds}
          suggestsAccumulating={suggestsAccumulating}
          showJumps={showJumps}
          isPinnedSystem={pinned?.systemKey === system.key && pinned.stationKey === null}
          onPin={() => onPin({ systemKey: system.key, stationKey: null })}
          onUnpin={onUnpin}
          cargoRunActive={cargoRunActive}
          nextStationKey={nextStationKey}
          rankSides={rankSides}
          marksDuplicates={marksDuplicates}
          fromJournal={fromJournal}
          knownTargets={knownTargets}
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
    </ul>
  )
}
