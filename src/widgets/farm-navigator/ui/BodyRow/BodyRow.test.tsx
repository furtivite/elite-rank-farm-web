import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ScoredStation } from '@/features/farm-recommender'
import { BodyRow } from '@/widgets/farm-navigator/ui/BodyRow/BodyRow'

function station(): ScoredStation {
  return {
    station: {
      id: 'st1',
      systemId: 's1',
      name: 'Hickam Survey',
      type: 'Outpost',
      maxPadSize: 'M',
      distanceToArrivalLs: 800,
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-03T00:00:00Z',
    },
    factions: { imperial: 3, federal: 0, alliance: 0, independent: 1, other: 0 },
    factionsDataState: 'unknown',
    rating: undefined,
    missionCount: 0,
    score: 42,
    reasons: [],
  }
}

function render(bodyName: string | null, missionCount = 0): string {
  return renderToStaticMarkup(
    React.createElement(BodyRow, {
      systemName: 'Ngalinn',
      systemId: 's1',
      group: { bodyName, stations: [station()], bestScore: 42, nearestLs: undefined, missionCount },
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      farmMode: 'empire' as const,
    }),
  )
}

test('строка тела свёрнута и не рендерит станции', () => {
  const html = render('Ngalinn 2')

  assert.match(html, /Ngalinn 2/)
  assert.match(html, /aria-expanded="false"/)
  assert.doesNotMatch(html, /Hickam Survey/)
})

test('станции без тела названы явно, а не пустой строкой', () => {
  const html = render(null)

  assert.match(html, /In orbit of the star/i)
})

test('взятые миссии видны на свёрнутой строке (41.8)', () => {
  const html = render('Ngalinn 2', 2)

  assert.match(html, /2/)
})
