import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import type { JournalMission, StoredMission, UseMissionStoreResult } from '@/entities/mission-store'
import { MissionBasket } from '@/widgets/mission-basket'

const JOURNAL: JournalMission = {
  missionId: '1001',
  name: 'Mission_Delivery',
  acceptedAt: '2026-09-08T18:00:00Z',
  detailsKnown: true,
  destinationSystem: 'Mainani',
  destinationStation: 'Kirk Dock',
}

const MANUAL: StoredMission = {
  id: 'm1',
  targetSystem: 'HIP 8060',
  targetStation: 'Fernandes Base',
  addedAt: '2026-09-03T10:00:00.000Z',
}

function render(manual: StoredMission[]): string {
  const store = {
    missions: manual,
    usedSlots: manual.length,
    completedCount: 0,
    isFull: false,
    returnReminders: [],
  } as unknown as UseMissionStoreResult
  const commander = {
    status: 'success',
    data: { state: { requiredPadSize: null }, features: [] },
    mockJournalMissions: [JOURNAL],
  } as unknown as UseCommanderStateResult

  return renderToStaticMarkup(
    React.createElement(MissionBasket, {
      regionKey: 'imperial',
      store,
      position: null,
      commander,
      jumpOrigin: null,
    }),
  )
}

test('у журнальной станции нет «−1», удаления и отметки «выполнено»', () => {
  const html = render([])

  assert.match(html, /Kirk Dock/)
  assert.match(html, /aria-label="Add a mission at station Kirk Dock"/)
  assert.doesNotMatch(html, /Remove a mission at station Kirk Dock/)
  assert.doesNotMatch(html, /Delete station Kirk Dock/)
  assert.doesNotMatch(html, /Delete every mission in system Mainani/)
  assert.doesNotMatch(html, /Mark completed/)
})

test('у ручной записи рядом с журнальной все кнопки на месте', () => {
  const html = render([MANUAL])

  assert.match(html, /Remove a mission at station Fernandes Base/)
  assert.match(html, /Delete station Fernandes Base/)
  assert.match(html, /Delete every mission in system HIP 8060/)
  assert.match(html, /Mark completed/)
})
