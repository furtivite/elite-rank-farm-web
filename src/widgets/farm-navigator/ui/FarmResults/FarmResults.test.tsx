import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ScoredStation, ScoredSystemGroup } from '@/features/farm-recommender'
import { FarmResults } from '@/widgets/farm-navigator'
import { SystemRow } from '@/widgets/farm-navigator/ui/SystemRow/SystemRow'
import { SystemRowSkeleton } from '@/widgets/farm-navigator/ui/SystemRowSkeleton/SystemRowSkeleton'

const group: ScoredSystemGroup = {
  systemId: 's1',
  systemName: 'Ngalinn',
  distanceLy: 12.3,
  stations: [],
  bestScore: 10,
  missionCount: 0,
}

const idleRefresh = {
  pendingSystemId: null,
  errorSystemId: null,
  errorMessage: null,
  refresh: async () => {},
}

function render(status: 'loading' | 'success', scored: ScoredSystemGroup[]): string {
  return renderToStaticMarkup(
    React.createElement(FarmResults, {
      status,
      errorMessage: null,
      groups: scored,
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      refresh: idleRefresh,
      farmMode: 'empire' as const,
    }),
  )
}

test('строка заглушки и строка выдачи одной высоты (64.2)', () => {
  const skeleton = renderToStaticMarkup(React.createElement(SystemRowSkeleton))
  const real = renderToStaticMarkup(
    React.createElement(SystemRow, {
      group,
      onSetRating: () => {},
      onAddMission: () => 'added' as const,
      onRefresh: () => {},
      isRefreshing: false,
      refreshError: null,
      farmMode: 'empire' as const,
    }),
  )

  for (const shape of ['px-2 py-2', 'text-sm', 'border-b']) {
    assert.ok(skeleton.includes(shape), `у заглушки нет ${shape}`)
    assert.ok(real.includes(shape), `у строки выдачи нет ${shape}`)
  }

  assert.match(skeleton, /class="flex h-5 /, 'заглушка обязана держать высоту строки явно')
})

test('повторный поиск не стирает прежнюю выдачу (64.3)', () => {
  const html = render('loading', [group])

  assert.match(html, /Ngalinn/)
  assert.match(html, /Searching for stations/)
  assert.match(html, /blur/)
})

test('первый поиск показывает заглушку, а не пустую рамку', () => {
  const html = render('loading', [])

  assert.doesNotMatch(html, /Ngalinn/)
  assert.match(html, /Searching for stations/)
  assert.ok(html.split('border-b').length > 3, 'строк заглушки слишком мало')
})

function groups(count: number): ScoredSystemGroup[] {
  return Array.from({ length: count }, (_, index) => ({
    ...group,
    systemId: `s${index}`,
    systemName: `Система ${index}`,
  }))
}

test('выдача показывается порциями по 25 систем (86.6, запрошено пользователем)', () => {
  const html = render('success', groups(30))

  assert.match(html, /Система 24/)
  assert.doesNotMatch(html, /Система 25/, '26-я система ждёт кнопки')
  assert.match(html, /Show 5 more/)
  assert.match(html, /Showing 25 of 30 systems/)
})

test('короткая выдача показывается целиком и без кнопки', () => {
  const html = render('success', groups(3))

  assert.match(html, /Система 2/)
  assert.doesNotMatch(html, /Show \d+ more/)
})

test('счётчик над таблицей говорит про всю выдачу, а не про показанную часть', () => {
  const html = render('success', groups(30))

  assert.match(html, /30 systems/)
  assert.doesNotMatch(html, /25 systems/)
})

test('станции внутри системы не режутся: 29 запрещает «ещё N станций»', () => {
  const stations: ScoredStation[] = Array.from({ length: 50 }, (_, index) => ({
    station: {
      id: `st${index}`,
      systemId: 'wide',
      name: `База ${index}`,
      missionProviderFactions: { status: 'unknown' as const },
      updatedAt: '2026-09-03T00:00:00Z',
    },
    factions: { imperial: 0, federal: 0, alliance: 0, independent: 0, other: 0 },
    factionsDataState: 'unknown' as const,
    rating: undefined,
    missionCount: 0,
    score: 1,
    reasons: [],
  }))

  const html = render('success', [{ ...group, systemId: 'wide', systemName: 'Широкая', stations }])

  assert.doesNotMatch(html, /Show \d+ more/)
  assert.match(html, /50 stations/)
})

test('озвучивается итог поиска, а не список (117)', () => {
  const html = render('success', [group])
  const live = html.slice(html.indexOf('role="status"'))

  assert.match(live.slice(0, 400), /Search finished/i)
  assert.match(live.slice(0, 400), /1 system/i)
  assert.doesNotMatch(live.slice(0, live.indexOf('</p>')), /Ngalinn/)
})

test('список выдачи живой областью не является (117)', () => {
  const html = render('success', [group])
  const rows = html.indexOf('Ngalinn')
  const liveEnd = html.indexOf('</p>', html.indexOf('role="status"'))

  assert.ok(liveEnd < rows, 'живая область закрывается до первой строки выдачи')
  assert.doesNotMatch(html.slice(rows), /aria-live/)
})

test('во время поиска объявляется поиск, и ровно один раз (117)', () => {
  const html = render('loading', [])

  assert.equal(html.split('Searching for stations').length - 1, 1)
})

test('строка системы называет просеянные станции (116.4)', () => {
  const html = render('success', [{ ...group, hiddenNoBoard: 3 }])

  assert.match(html, /3 more/i)
  assert.match(html, /mission board/i)
})

test('без просеянных строки нет вовсе', () => {
  const html = render('success', [{ ...group, hiddenNoBoard: 0 }])

  assert.doesNotMatch(html, /more — the data/i)
})
