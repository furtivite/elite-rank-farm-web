import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findScenario } from '@/entities/commander-state'
import {
  awaitsCargo,
  findMissionCycles,
  groupMissions,
  type StoredMission,
} from '@/entities/mission-store'
import { planCargoRun } from '@/features/next-destination'

test('«задания из игры» дают корзину из пяти заданий (70)', () => {
  const scenario = findScenario('journal-basket')
  const missions = scenario.journalMissions ?? []

  assert.equal(missions.length, 5)

  const groups = groupMissions(
    missions.map((mission): StoredMission => ({
      id: mission.missionId,
      targetSystem: mission.destinationSystem ?? '',
      targetStation: mission.destinationStation ?? '',
      addedAt: mission.acceptedAt,
    })),
  )

  assert.equal(groups.length, 3)
})

test('«задания без подробностей» и правда без них (70.6)', () => {
  const missions = findScenario('journal-partial').journalMissions ?? []

  assert.ok(
    missions.some((mission) => mission.detailsKnown === false),
    'иначе набор показывает обычную корзину и своего смысла не имеет',
  )
})

test('«недовезённый груз» зовёт на склад, а не на сдачу (112.1)', () => {
  const scenario = findScenario('journal-cargo')
  const missions = scenario.journalMissions ?? []
  const state = scenario.data?.state

  const plan = planCargoRun(missions, {
    currentSystemName: state?.currentSystem.name,
    history: state?.recentSystems ?? [],
  })

  assert.equal(plan?.pickup.systemName, 'Ngalinn')
  assert.equal(plan?.pickup.stationName, 'Hickam Survey')
  assert.equal(plan?.pickup.remaining, 964)
})

test('«недовезённый груз» показывает и режим челнока (112.1)', () => {
  const scenario = findScenario('journal-cargo')
  const state = scenario.data?.state

  const plan = planCargoRun(scenario.journalMissions ?? [], {
    currentSystemName: state?.currentSystem.name,
    history: state?.recentSystems ?? [],
  })

  assert.equal(plan?.shuttle, true)
})

test('«склад ещё не тронут» зовёт на станцию взятия (112.1)', () => {
  const plan = planCargoRun(findScenario('journal-cargo-untouched').journalMissions ?? [])

  assert.equal(plan?.pickup.systemName, 'HIP 11241')
  assert.equal(plan?.pickup.stationName, 'Esposito City')
})

test('«Collect без товара» не зовёт лететь, курьерское — зовёт (70.6)', () => {
  const groups = groupMissions(
    (findScenario('journal-collect-awaiting').journalMissions ?? []).map(
      (mission): StoredMission => ({
        id: mission.missionId,
        targetSystem: mission.destinationSystem ?? '',
        targetStation: mission.destinationStation ?? '',
        awaitingCargo: awaitsCargo(mission.cargo),
        addedAt: mission.acceptedAt,
      }),
    ),
  )

  assert.equal(groups.length, 2, 'обе системы в корзине')
  assert.equal(groups[0].systemName, 'Ngalinn')
  assert.equal(groups[1].systemName, 'Col 285 Sector VD-A b14-1')
  assert.equal(groups[1].awaitingCount, 1)
})

test('«кольцо с порожним перегоном» собирает цепочку в круг (114.1)', () => {
  const cycles = findMissionCycles(findScenario('journal-wing-ring').journalMissions ?? [])

  assert.equal(cycles.length, 1)
  assert.equal(cycles[0].emptyReturn, true)
  assert.equal(cycles[0].stations[0].stationName, 'Esposito City')
})

test('обычные наборы правило склада не включают', () => {
  const plan = planCargoRun(findScenario('journal-basket').journalMissions ?? [], {
    currentSystemName: 'Ngalinn',
  })

  assert.equal(plan, null)
})
