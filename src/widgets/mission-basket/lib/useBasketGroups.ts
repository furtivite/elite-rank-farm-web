'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import { type ArrivalStar, type RegionCliKey } from '@/entities/galaxy-data'
import {
  applySnapshotOrder,
  estimateCloseTime,
  getReturnLegsSnapshot,
  groupMissions,
  rankSidesByStation,
  returnLegKey,
  snapshotOrder,
  stationDistancesFrom,
  useJournalMissionsRead,
  useJournalTargets,
  useMissionJumps,
  useMissionStationFacts,
  useMissionSystemCoords,
  writeReturnLegs,
  pinChosenSystem,
  pinCurrentPosition,
  type CommanderPosition,
  type JumpOrigin,
  type MissionOrderContext,
  type OrderSnapshot,
  type ReturnLeg,
  type StoredMission,
  type UseMissionStoreResult,
} from '@/entities/mission-store'
import { journalTargets } from '@/entities/mission-store/lib/duplicateHint'
import { journalToStored, withoutDetails } from '@/entities/mission-store/lib/journalToStored'
import { landingCheck, warnsAboutLanding } from '@/entities/mission-store/lib/landingWarning'
import {
  getServerDemoSandboxActive,
  isDemoSandboxActive,
  subscribeToDemoSandbox,
} from '@/shared/lib/demoSandbox'
import { useDropPinWhenGone } from '@/features/next-destination'
import {
  cargoTonsBySystem,
  hasReturnLegInBasket,
  hasUncollectedDepot,
  planRoute,
} from '@/features/route-plan'
import type { BlockedBase } from '@/features/blocked-bases'
import { blockedInBasketSystems } from '@/widgets/mission-basket/lib/blockedInBasketSystems'
import { newReminder } from '@/widgets/mission-basket/lib/newReminder'
import { startStationDistance } from '@/widgets/mission-basket/lib/startStationDistance'

type UseBasketGroupsInput = {
  regionKey: RegionCliKey
  store: UseMissionStoreResult
  commander: UseCommanderStateResult
  position: CommanderPosition | null
  jumpOrigin: JumpOrigin | null
  requiredPadSize: 'S' | 'M' | 'L' | null
  manualSettings: { addManually: boolean }
  starMarks: ReadonlyMap<string, boolean>
  pinned: { systemKey: string; stationKey: string | null } | null
  returnLegs: Readonly<Record<string, ReturnLeg>>
  blockedBases: readonly BlockedBase[]
}

export function useBasketGroups({
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
  blockedBases,
}: UseBasketGroupsInput) {
  const journalRead = useJournalMissionsRead(commander.mockJournalMissions)
  const journalMissions = journalRead.missions
  const journalTargetsFound = useJournalTargets(regionKey, journalMissions)
  const datasetTargets = journalTargetsFound.byName
  const rankStations = rankSidesByStation(journalMissions)
  const journalStored = journalMissions
    .map((mission) => journalToStored(mission, datasetTargets))
    .filter((mission): mission is StoredMission => mission !== null)
  const unknownJournal = withoutDetails(journalMissions)
  const knownTargets = journalTargets(journalStored)

  const manualMissions =
    manualSettings.addManually || commander.mockManualMissions !== null ? store.missions : []

  const targetedMissions = [...journalStored, ...manualMissions]

  const jumps = useMissionJumps(regionKey, targetedMissions, jumpOrigin)
  const stationFacts = useMissionStationFacts(
    regionKey,
    targetedMissions,
    journalTargetsFound.revision,
  )

  const starOf = (stationId: string | undefined): ArrivalStar | undefined => {
    if (stationId === undefined) {
      return undefined
    }
    const factStar = stationFacts.get(stationId)?.star
    const override = starMarks.get(stationId)
    if (override === true) {
      return { isMain: false, source: 'manual' }
    }
    if (override === false) {
      return factStar?.source === 'manual' ? undefined : factStar
    }
    return factStar
  }

  const groupingOptions: MissionOrderContext = {
    jumps,
    stationDistanceLs: stationDistancesFrom(stationFacts),
    canLandAt: (station) =>
      !warnsAboutLanding(
        landingCheck(
          station.stationId === undefined
            ? undefined
            : stationFacts.get(station.stationId)?.maxPadSize,
          requiredPadSize,
        ),
      ),
    atOtherStar: (station) => starOf(station.stationId)?.isMain === false,
  }

  const naturalGroups = pinChosenSystem(
    pinCurrentPosition(groupMissions(journalStored, groupingOptions), position),
    pinned?.stationKey === null ? (pinned.systemKey ?? null) : null,
  )
  const [frozenOrder, setFrozenOrder] = useState<OrderSnapshot | null>(null)

  const groups =
    frozenOrder === null ? naturalGroups : applySnapshotOrder(naturalGroups, frozenOrder)

  const freeze = () => {
    if (frozenOrder === null) {
      setFrozenOrder(snapshotOrder(naturalGroups))
    }
  }

  const unfreezeIfLeft = (event: React.FocusEvent | React.PointerEvent) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return
    }
    setFrozenOrder(null)
  }

  const manualGroups = groupMissions(manualMissions, groupingOptions)

  const closeTime = estimateCloseTime([...groups, ...manualGroups], stationFacts)

  const systemCoords = useMissionSystemCoords(regionKey, targetedMissions)
  const routeSystems = [...groups, ...manualGroups]
  const startStationDistanceLs = startStationDistance(routeSystems, position, stationFacts)
  const route = planRoute(routeSystems, systemCoords, jumpOrigin, stationFacts, {
    hasUncollectedDepot: hasUncollectedDepot(journalMissions),
    hasReturnLeg: hasReturnLegInBasket(routeSystems, returnLegs),
    cargoTonsBySystem: cargoTonsBySystem(journalMissions),
    start: {
      systemName: position?.systemName ?? '',
      stationName: position?.stationName ?? null,
      distanceToArrivalLs: startStationDistanceLs,
    },
  })

  const demoCopiesReady = useSyncExternalStore(
    subscribeToDemoSandbox,
    isDemoSandboxActive,
    getServerDemoSandboxActive,
  )
  useDropPinWhenGone(
    [...groups, ...manualGroups].map((group) => group.key),
    journalRead.lastReadSucceeded && (commander.mockJournalMissions === null || demoCopiesReady),
  )

  const seenStations = useRef<Set<string> | null>(null)

  useEffect(() => {
    const present = new Set<string>()
    for (const group of [...naturalGroups, ...manualGroups]) {
      for (const body of group.bodies) {
        for (const station of body.stations) {
          present.add(returnLegKey(group.systemName, station.stationName))
        }
      }
    }

    const before = seenStations.current
    seenStations.current = present
    if (before === null) {
      return
    }

    const legs = getReturnLegsSnapshot()
    const gone = [...before].filter((key) => !present.has(key) && legs[key] !== undefined)
    if (gone.length === 0) {
      return
    }

    const reminders = [...store.returnReminders]
    const known = new Set(reminders.map((item) => returnLegKey(item.systemName, item.stationName)))
    const nextLegs = { ...legs }

    for (const key of gone) {
      const leg = legs[key]
      delete nextLegs[key]

      const target = returnLegKey(leg.systemName, leg.stationName)
      if (leg.extraRun !== true || known.has(target)) {
        continue
      }
      known.add(target)
      reminders.push(newReminder(leg.systemName, leg.stationName))
    }

    writeReturnLegs(nextLegs)
    if (reminders.length !== store.returnReminders.length) {
      store.addReturnReminders(reminders)
    }
    // eslint-disable-next-line react/exhaustive-effect-dependencies
  }, [naturalGroups, manualGroups, store])

  const blockedInBasket = blockedInBasketSystems(blockedBases, [...naturalGroups, ...manualGroups])

  return {
    journalRead,
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
  }
}
