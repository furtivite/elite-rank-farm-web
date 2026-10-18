import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MissionCargoNote } from '@/widgets/mission-basket/ui/MissionCargoNote'
import { findScenario } from '@/entities/commander-state'
import type { JournalMission } from '@/entities/mission-store'

const MISSION: JournalMission = {
  missionId: '1065480444',
  name: 'Mission_DeliveryWing_Boom',
  destinationSystem: 'Col 285 Sector SX-B b13-2',
  destinationStation: 'Tull Reach',
  acceptedAt: '2026-09-08T11:12:55Z',
  detailsKnown: true,
  cargo: {
    commodity: '$SurvivalEquipment_Name;',
    commodityLocalised: 'Снаряжение для выживания',
    total: 6004,
    delivered: 3600,
    collected: 3600,
  },
}

const render = (
  missions: JournalMission[],
  capacity: number | undefined,
  returnLeg?: { systemName: string; stationName: string },
) =>
  renderToStaticMarkup(
    React.createElement(MissionCargoNote, { missions, cargoCapacityT: capacity, returnLeg }),
  )

const WITH_SOURCE: JournalMission = {
  ...MISSION,
  cargo: {
    ...MISSION.cargo!,
    sourceMarketId: '4224570115',
    sourceSystem: 'Ngalinn',
    sourceStation: 'Gloss Gateway',
  },
}

test('главное — два числа: в трюме и осталось', () => {
  const html = render([MISSION], 720)

  assert.match(html, /in hold 0 \| remaining 2404/)
  assert.match(html, /Снаряжение для выживания/)
})

test('числа спецификации 112.2: 6004 / сдано 5040 / в трюме 720', () => {
  const loaded: JournalMission = {
    ...MISSION,
    cargo: { ...MISSION.cargo!, delivered: 5040, collected: 5760 },
  }

  const byBigHold = render([loaded], 720)
  assert.match(byBigHold, /in hold 720 \| remaining 244/)
  assert.doesNotMatch(byBigHold, /≈/)

  assert.match(render([loaded], 200), /≈ 2 runs by hold 200/)
})

test('оценка ходок считается от недобранного, а не от всего остатка', () => {
  const partial: JournalMission = {
    ...MISSION,
    cargo: { ...MISSION.cargo!, collected: 3700 },
  }

  assert.match(render([partial], 720), /≈ 4 runs by hold 720/)
})

test('без вместимости рейсы не выдумываются', () => {
  const html = render([MISSION], undefined)

  assert.match(html, /remaining 2404/)
  assert.doesNotMatch(html, /≈/)
  assert.match(html, /hold size unknown/)
})

test('задание без груза строки не даёт', () => {
  const courier: JournalMission = { ...MISSION, cargo: undefined }

  assert.equal(render([courier], 720), '')
})

test('довезённое молчит, а не пишет «осталось ноль»', () => {
  const done: JournalMission = {
    ...MISSION,
    cargo: { ...MISSION.cargo!, delivered: 6004, collected: 6004 },
  }

  assert.equal(render([done], 720), '')
})

test('потерянное при гибели названо отдельно', () => {
  const lost: JournalMission = {
    ...MISSION,
    cargo: { total: 6004, delivered: 2880, collected: 3600, lost: 720 },
  }
  const html = render([lost], 720)

  assert.match(html, /720 lost when destroyed/)
  assert.match(html, /in hold 0/)
})

test('у двух заданий на станцию — две строки', () => {
  const second: JournalMission = {
    ...MISSION,
    missionId: '2',
    cargo: { total: 100, delivered: 0, commodityLocalised: 'Сверхпроводники' },
  }
  const html = render([MISSION, second], 720)

  assert.equal((html.match(/<p /g) ?? []).length, 2)
  assert.match(html, /Сверхпроводники/)
})

test('говорит, где лежит остаток', () => {
  const html = render([WITH_SOURCE], 720)

  assert.match(html, /Ngalinn/)
  assert.match(html, /Gloss Gateway/)
})

test('весь остаток уже в трюме — «взято в», а не «лежит»', () => {
  const allAboard: JournalMission = {
    ...WITH_SOURCE,
    cargo: { ...WITH_SOURCE.cargo!, collected: 6004 },
  }
  const html = render([allAboard], 720)

  assert.match(html, /collected at Ngalinn · Gloss Gateway/)
  assert.doesNotMatch(html, /waiting at/)
})

test('склад ещё не тронут — «лежит» по станции взятия', () => {
  const untouched: JournalMission = {
    ...MISSION,
    originSystem: 'HIP 11241',
    originStation: 'Esposito City',
    cargo: { commodityLocalised: 'Снаряжение для выживания', total: 5868 },
  }

  assert.match(render([untouched], 1040), /waiting at HIP 11241 · Esposito City/)
})

test('без имени склада голый идентификатор не показывается', () => {
  const onlyId: JournalMission = {
    ...MISSION,
    cargo: { ...MISSION.cargo!, sourceMarketId: '4224570115' },
  }

  assert.doesNotMatch(render([onlyId], 720), /4224570115/)
})

test('отмеченный возврат на тот же склад назван и помечен значком', () => {
  const html = render([WITH_SOURCE], 720, {
    systemName: 'Ngalinn',
    stationName: 'Gloss Gateway',
  })

  assert.match(html, /<svg/, 'значок возврата — тот же, что у самой отметки')
  assert.match(html, /return trip/i)
})

test('возврат на другую станцию к складу не приписывается', () => {
  const html = render([WITH_SOURCE], 720, {
    systemName: 'Ngalinn',
    stationName: 'Другая станция',
  })

  assert.doesNotMatch(html, /return trip/i)
})

test('набор показа «кольцо» рисует оба числа и оценку ходок', () => {
  const missions = findScenario('journal-wing-ring').journalMissions ?? []
  const html = render([missions[0]!], 1040)

  assert.match(html, /in hold 1040 \| remaining 2748/)
  assert.match(html, /≈ 3 runs by hold 1040/)
})

test('Collect без товара: в трюме — по агенту, и сказано, что лететь не зовём (70.6)', () => {
  const [collect] = findScenario('journal-collect-awaiting').journalMissions ?? []
  assert.ok(collect)
  const html = render([collect], 720)

  assert.match(html, /in hold 120 \| remaining 370/)
  assert.match(html, /cannot be handed in yet/)
})

test('Collect с полным трюмом пометки «не зовём» не получает (70.6)', () => {
  const [collect] = findScenario('journal-collect-awaiting').journalMissions ?? []
  assert.ok(collect?.cargo)
  const html = render([{ ...collect, cargo: { ...collect.cargo, inHold: 490 } }], 720)

  assert.doesNotMatch(html, /cannot be handed in yet/)
})
