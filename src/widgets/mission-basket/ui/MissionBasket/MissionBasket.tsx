'use client'

import { type UseCommanderStateResult, usePositionHistory } from '@/entities/commander-state'
import {
  getManualMissionSettings,
  getServerManualMissionSettings,
  subscribeToManualMissionSettings,
} from '@/entities/mission-store'
import { useSyncExternalStore } from 'react'
import { useIsAdmin } from '@/entities/session'
import { useBlockedBases } from '@/features/blocked-bases'
import { BasketBulkControls } from '@/widgets/mission-basket/ui/BasketBulkControls'
import { BasketLists } from '@/widgets/mission-basket/ui/BasketLists'
import { BasketSlotsSummary } from '@/widgets/mission-basket/ui/BasketSlotsSummary'
import { BlockedInBasketSection } from '@/widgets/mission-basket/ui/BlockedInBasketSection'
import { useBasketGroups } from '@/widgets/mission-basket/lib/useBasketGroups'
import { AddMissionForm } from '@/features/add-mission'
import { MissionCycles } from '@/widgets/mission-basket/ui/MissionCycles/MissionCycles'
import {
  NextDestinationPanel,
  pickNextDestination,
  usePinnedTarget,
} from '@/features/next-destination'
import { planCargoRun, ringStep } from '@/features/next-destination'
import { useStationRatings } from '@/entities/station-rating'
import type { RegionCliKey } from '@/entities/galaxy-data'
import {
  getServerStarMarkSnapshot,
  getStarMarkSnapshot,
  subscribeToStarMarks,
} from '@/entities/galaxy-data'
import {
  type JumpOrigin,
  type CommanderPosition,
  type MissionStationGroup,
  getAccumulationSnapshot,
  getServerAccumulationSnapshot,
  setAccumulationThresholds,
  subscribeToAccumulation,
  MISSION_WARN_FROM,
  slotCount,
  type UseMissionStoreResult,
} from '@/entities/mission-store'
import { useTranslation } from '@/shared/lib/i18n'
import { AccumulationSettings } from '@/widgets/mission-basket/ui/AccumulationSettings'
import {
  getReturnLegsSnapshot,
  getServerReturnLegsSnapshot,
  subscribeToReturnLegs,
} from '@/entities/mission-store'
import { ReturnReminders } from '@/widgets/mission-basket/ui/ReturnReminders'
import { RoutePlanBlock } from '@/widgets/mission-basket/ui/RoutePlan'

type MissionBasketProps = {
  regionKey: RegionCliKey
  store: UseMissionStoreResult
  position: CommanderPosition | null
  commander: UseCommanderStateResult
  jumpOrigin: JumpOrigin | null
}

export function MissionBasket({
  regionKey,
  store,
  position,
  commander,
  jumpOrigin,
}: MissionBasketProps) {
  const t = useTranslation()
  const manualSettings = useSyncExternalStore(
    subscribeToManualMissionSettings,
    getManualMissionSettings,
    getServerManualMissionSettings,
  )
  const requiredPadSize = commander.data?.state.requiredPadSize ?? null
  const cargoCapacityT = commander.data?.state.loadout?.cargoCapacityT
  const blocked = useBlockedBases()
  const isAdmin = useIsAdmin()
  const { ratings } = useStationRatings()
  const { pinned, pin, unpin } = usePinnedTarget()
  const starMarks = useSyncExternalStore(
    subscribeToStarMarks,
    getStarMarkSnapshot,
    getServerStarMarkSnapshot,
  )
  const returnLegs = useSyncExternalStore(
    subscribeToReturnLegs,
    getReturnLegsSnapshot,
    getServerReturnLegsSnapshot,
  )

  const {
    journalMissions,
    rankStations,
    unknownJournal,
    knownTargets,
    manualMissions,
    stationFacts,
    starOf,
    groups,
    manualGroups,
    closeTime,
    route,
    blockedInBasket,
    freeze,
    unfreezeIfLeft,
  } = useBasketGroups({
    regionKey,
    store,
    commander,
    position,
    jumpOrigin,
    requiredPadSize,
    manualSettings,
    starMarks,
    pinned,
    returnLegs,
    blockedBases: blocked.bases,
  })

  const addAtStation = (station: MissionStationGroup) => {
    const [template] = station.missions
    if (template === undefined) {
      return
    }

    store.addMission({
      targetSystem: template.targetSystem,
      targetSystemId: template.targetSystemId,
      targetBody: template.targetBody,
      targetStation: template.targetStation,
      targetStationId: template.targetStationId,
    })
  }

  const removeLastAtStation = (station: MissionStationGroup) => {
    const pending = station.missions.filter((mission) => mission.completed !== true)
    const target = pending.at(-1) ?? station.missions.at(-1)
    if (target !== undefined) {
      store.removeMission(target.id)
    }
  }
  const slots = slotCount(
    journalMissions.length,
    manualMissions.length,
    manualSettings.excludeFromCount,
  )
  const positionHistory = usePositionHistory(
    position?.systemName,
    commander.data?.state.observedAt,
    commander.data?.state.recentSystems,
  )

  const cargoRun = planCargoRun(journalMissions, {
    currentSystemName: position?.systemName ?? null,
    history: positionHistory,
  })

  const ring = ringStep(journalMissions, {
    systemName: position?.systemName,
    stationName: position?.stationName,
  })

  const destination = pickNextDestination(groups, t, {
    stationFacts,
    ratings,
    pinned,
    currentSystemName: position?.systemName ?? null,
    currentStationName: position?.stationName ?? null,
    freeingSlots: slots.used >= MISSION_WARN_FROM,
  })

  const used = slots.used
  const suggestsAccumulating = used < slots.limit

  const thresholds = useSyncExternalStore(
    subscribeToAccumulation,
    getAccumulationSnapshot,
    getServerAccumulationSnapshot,
  )

  const listProps = {
    position,
    requiredPadSize,
    stationFacts,
    starOf,
    thresholds,
    suggestsAccumulating,
    showJumps: jumpOrigin !== null,
    pinned,
    onPin: pin,
    onUnpin: unpin,
    cargoRunActive: cargoRun !== null,
    nextStationKey: destination?.stationKey,
    knownTargets,
    commander,
    store,
    isAdmin,
    returnLegs,
    journalMissions,
    cargoCapacityT,
    onAddOne: addAtStation,
    onRemoveOne: removeLastAtStation,
    onFreeze: freeze,
    onUnfreezeIfLeft: unfreezeIfLeft,
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="basket-heading" className="flex flex-col gap-2">
        <h2 id="basket-heading" className="text-sm font-semibold">
          {t('basket.heading')}
        </h2>

        <BasketSlotsSummary slots={slots} closeTime={closeTime} store={store} />

        <ReturnReminders
          reminders={store.returnReminders}
          onDismiss={store.dismissReturnReminder}
        />

        <NextDestinationPanel
          usedSlots={used}
          destination={destination}
          plan={cargoRun}
          ring={ring}
        />

        <RoutePlanBlock plan={route} />

        <MissionCycles missions={journalMissions} position={position} />

        {manualSettings.addManually ? (
          <AddMissionForm
            regionKey={regionKey}
            isFull={!slots.canAddManual}
            onAdd={store.addMission}
          />
        ) : null}

        <AccumulationSettings thresholds={thresholds} onChange={setAccumulationThresholds} />

        <BasketLists
          groups={groups}
          manualGroups={manualGroups}
          rankStations={rankStations}
          unknownJournal={unknownJournal}
          listProps={listProps}
        />
        <BasketBulkControls store={store} />
      </section>

      <BlockedInBasketSection blocked={blocked} blockedInBasket={blockedInBasket} />
    </div>
  )
}
