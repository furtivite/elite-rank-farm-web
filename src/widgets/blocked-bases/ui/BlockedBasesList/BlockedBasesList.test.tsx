import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BlockedBaseCardSkeleton } from '@/widgets/blocked-bases/ui/BlockedBaseCardSkeleton/BlockedBaseCardSkeleton'
import { BlockedBaseCard } from '@/widgets/blocked-bases/ui/BlockedBaseCard/BlockedBaseCard'
import type { BlockedBase } from '@/features/blocked-bases'

const base: BlockedBase = {
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
  systemId: 's1',
  systemName: 'Ngalinn',
  systemFactionSummary: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
  systemFactions: [],
  regionKey: 'imperial',
  blockedAt: '2026-09-03T00:00:00Z',
  note: undefined,
}

test('оболочка заглушки совпадает с оболочкой карточки', () => {
  const skeleton = renderToStaticMarkup(React.createElement(BlockedBaseCardSkeleton))
  const real = renderToStaticMarkup(
    React.createElement(BlockedBaseCard, {
      base,
      onUnblock: () => {},
      onSetRating: () => {},
      onSaveNote: () => {},
    }),
  )

  for (const shape of ['rounded-md', 'border', 'p-3', 'text-sm', 'gap-2']) {
    assert.ok(skeleton.includes(shape), `у заглушки нет ${shape}`)
    assert.ok(real.includes(shape), `у карточки нет ${shape}`)
  }
})

test('заглушка не читается вслух как данные', () => {
  const html = renderToStaticMarkup(React.createElement(BlockedBaseCardSkeleton))

  assert.match(html, /aria-hidden="true"/)
})
