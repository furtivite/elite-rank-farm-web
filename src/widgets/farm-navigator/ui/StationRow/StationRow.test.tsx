import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ScoredStation } from '@/features/farm-recommender'
import type { DataSource } from '@/entities/galaxy-data'
import { StationRow } from '@/widgets/farm-navigator/ui/StationRow/StationRow'

function render(hasMissionBoard: boolean | undefined, source?: DataSource): string {
  const scored = {
    station: {
      id: 'st1',
      systemId: 's1',
      name: 'Black Landing',
      type: 'Outpost',
      maxPadSize: 'M',
      distanceToArrivalLs: 120,
      hasMissionBoard,
      missionBoardSource: source,
      missionProviderFactions: { status: 'unknown' },
      updatedAt: '2026-09-16T06:00:00Z',
    },
    factions: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    factionsDataState: 'unknown',
    rating: undefined,
    missionCount: 0,
    score: 10,
    reasons: [],
  } as unknown as ScoredStation

  return renderToStaticMarkup(
    React.createElement(StationRow, {
      systemName: 'Ngalinn',
      systemId: 's1',
      scored,
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      farmMode: 'empire' as const,
      fine: null,
    }),
  )
}

test('дамп говорит «доски нет» — доска под вопросом (116.5)', () => {
  const html = render(false, 'builder')

  assert.match(html, /in doubt/i)
  assert.doesNotMatch(html, /no mission board/i)
})

test('игра говорит «доски нет» — так и сказано (116.5)', () => {
  const html = render(false, 'journal')

  assert.match(html, /no mission board/i)
  assert.doesNotMatch(html, /in doubt/i)
})

test('источника нет — считаем словом дампа (116.5)', () => {
  assert.match(render(false), /in doubt/i)
})

test('доска есть и «неизвестно» остались как были', () => {
  assert.match(render(true), /mission board/i)
  assert.match(render(undefined), /unknown/i)
})
