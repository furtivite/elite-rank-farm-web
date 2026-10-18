import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { MissionStationGroup, UseMissionStoreResult } from '@/entities/mission-store'
import { StationBadges } from '@/widgets/mission-basket/ui/StationBadges'

const station: MissionStationGroup = {
  key: 'st-1',
  stationName: 'Fernandes Base',
  stationId: 'st-1',
  missions: [
    {
      id: 'm1',
      targetSystem: 'HIP 8060',
      targetStation: 'Fernandes Base',
      addedAt: '2026-09-21T10:00:00.000Z',
    },
  ],
  completedCount: 0,
  awaitingCount: 0,
}

function render(isSurface: boolean): string {
  return renderToStaticMarkup(
    React.createElement(StationBadges, {
      systemName: 'HIP 8060',
      station,
      isCurrent: false,
      isNextTarget: false,
      starNote: null,
      isSurface,
      arrivalLs: undefined,
      rankLabel: null,
      duplicate: false,
      warnsLanding: false,
      fine: null,
      store: {} as unknown as UseMissionStoreResult,
    }),
  )
}

test('наземная станция помечена словом', () => {
  const html = render(true)

  assert.match(html, /surface/)
  assert.match(html, /Fernandes Base/)
})

test('орбитальная и неизвестная не помечаются ничем', () => {
  const html = render(false)

  assert.doesNotMatch(html, /surface/)
  assert.doesNotMatch(html, /orbital/)
})
