import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ScoredStation, ScoredSystemGroup } from '@/features/farm-recommender'
import { SystemRow } from '@/widgets/farm-navigator/ui/SystemRow/SystemRow'
import { StationRow } from '@/widgets/farm-navigator/ui/StationRow/StationRow'
import { SystemAgeBadge } from '@/widgets/farm-navigator/ui/SystemAgeBadge/SystemAgeBadge'
import { renderInDom } from '@/shared/test/renderInDom'

function station(overrides: Partial<ScoredStation> = {}): ScoredStation {
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
    reasons: [{ label: '800 ls', delta: 8 }],
    ...overrides,
  }
}

const group: ScoredSystemGroup = {
  systemId: 's1',
  systemName: 'Ngalinn',
  distanceLy: 12.34,
  stations: [station()],
  bestScore: 42,
  missionCount: 0,
}

const noop = () => {}
const add = () => 'added' as const

type RefreshProps = {
  isRefreshing?: boolean
  refreshError?: string | null
}

function renderSystem(
  overrides: Partial<ScoredSystemGroup> = {},
  refresh: RefreshProps = {},
): string {
  return renderToStaticMarkup(
    React.createElement(SystemRow, {
      group: { ...group, ...overrides },
      onSetRating: noop,
      onAddMission: add,
      onRefresh: noop,
      isRefreshing: refresh.isRefreshing ?? false,
      refreshError: refresh.refreshError ?? null,
      farmMode: 'empire' as const,
    }),
  )
}

test('свёрнутая строка системы самодостаточна (41.2)', () => {
  const html = renderSystem()

  assert.match(html, /Ngalinn/)
  assert.match(html, /12\.3\u00a0ly/)
  assert.match(html, /1 stn/)
  assert.match(html, /aria-expanded="false"/)
})

test('метка возраста стоит своей строкой под названием, а не в общем ряду (104.2)', async () => {
  const rendered = await renderInDom(
    React.createElement(SystemRow, {
      group: {
        ...group,
        updatedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      onSetRating: noop,
      onAddMission: add,
      onRefresh: noop,
      isRefreshing: false,
      refreshError: null,
      farmMode: 'empire' as const,
    }),
  )
  await rendered.settle()

  const expander = rendered.container.querySelector('button[aria-expanded]')
  assert.ok(expander, 'раскрывающая кнопка на месте')

  const [topRow, badge] = Array.from(expander.children)
  assert.ok(badge, 'метка — отдельный ребёнок кнопки, а не элемент верхнего ряда')
  assert.match(badge.textContent ?? '', /ago/)
  assert.doesNotMatch(topRow.textContent ?? '', /ago/)
  assert.match(topRow.textContent ?? '', /Ngalinn/)

  rendered.unmount()
})

test('станции внутри свёрнутой системы не рендерятся', () => {
  const html = renderSystem()

  assert.doesNotMatch(html, /Hickam Survey/)
})

test('взятые миссии показываются в строке системы (41.8)', () => {
  const html = renderSystem({ missionCount: 3 })

  assert.match(html, /missions 3/)
})

test('строка станции показывает то, по чему её выбирают', () => {
  const html = renderToStaticMarkup(
    React.createElement(StationRow, {
      systemName: 'Ngalinn',
      systemId: 's1',
      scored: station(),
      onSetRating: noop,
      onAddMission: add,
      farmMode: 'empire' as const,
    }),
  )

  assert.match(html, /Hickam Survey/)
  assert.match(html, /800/)
  assert.match(html, /M/)
})

function renderStation(scored = station(), farmMode: 'empire' | 'federal' = 'empire'): string {
  return renderToStaticMarkup(
    React.createElement(StationRow, {
      systemName: 'Ngalinn',
      systemId: 's1',
      scored,
      onSetRating: noop,
      onAddMission: add,
      farmMode,
    }),
  )
}

test('сторона текущего Farm Mode выделена не одним цветом (11, WCAG 1.4.1)', () => {
  const empire = renderStation(station(), 'empire')

  assert.match(empire, /font-semibold[^"]*">Imp ×3</)
  assert.match(empire, /Imp ×3<\/span><span class="sr-only"> — your side</)
})

test('при федеральном режиме выделяется федеральная сторона (11)', () => {
  const federal = renderStation(
    station({ factions: { imperial: 3, federal: 2, alliance: 0, independent: 0, other: 0 } }),
    'federal',
  )

  assert.match(federal, /font-semibold[^"]*">Fed ×2</)
  assert.doesNotMatch(federal, /font-semibold[^"]*">Imp ×3</)
})

test('наличие доски миссий видно в строке станции (8)', () => {
  assert.match(
    renderStation(station({ station: { ...station().station, hasMissionBoard: true } })),
    /mission board/,
  )
  assert.match(renderStation(), /mission board unknown/)
})

test('состав фракций назван системным, а не станционным (10.3)', () => {
  const html = renderToStaticMarkup(
    React.createElement(StationRow, {
      systemName: 'Ngalinn',
      systemId: 's1',
      scored: station(),
      onSetRating: noop,
      onAddMission: add,
      farmMode: 'empire' as const,
    }),
  )

  assert.match(html, /System factions/)
})

const NOW = new Date('2026-09-04T12:00:00Z').getTime()
const DAY_MS = 24 * 60 * 60 * 1000

function renderBadge(updatedAt: string | undefined, now: number | null = NOW): string {
  return renderToStaticMarkup(React.createElement(SystemAgeBadge, { updatedAt, now }))
}

test('устаревшая система получает бейдж с возрастом (30)', () => {
  const html = renderBadge(new Date(NOW - 200 * DAY_MS).toISOString())

  assert.match(html, /data /)
  assert.match(html, /6 months ago/)
})

test('свежая система бейджа возраста не получает (30)', () => {
  assert.equal(renderBadge(new Date(NOW - 3 * DAY_MS).toISOString()), '')
})

test('система без метки времени бейджа не получает: unknown — не «плохо» (30)', () => {
  assert.equal(renderBadge(undefined), '')
})

test('без часов бейджа нет: на сервере время неизвестно (30)', () => {
  assert.equal(renderBadge(new Date(NOW - 200 * DAY_MS).toISOString(), null), '')
  assert.doesNotMatch(
    renderSystem({ updatedAt: new Date(NOW - 200 * DAY_MS).toISOString() }),
    / назад</,
  )
})

test('у каждой системы своя кнопка обновления, названная по имени системы', () => {
  const html = renderSystem()

  assert.match(html, /aria-label="Refresh data for system Ngalinn"/)
  assert.match(html, />Refresh</)
})

test('кнопка обновления лежит рядом с раскрывающей, а не внутри неё', () => {
  const html = renderSystem()
  const expander = html.indexOf('aria-expanded')
  const refresh = html.indexOf('aria-label="Refresh data for system')
  const expanderEnd = html.indexOf('</button>', expander)

  assert.ok(expander !== -1 && refresh !== -1)
  assert.ok(refresh > expanderEnd, 'кнопка обновления оказалась внутри раскрывающей')
})

test('идущее обновление видно и повторное нажатие невозможно', () => {
  const html = renderSystem({}, { isRefreshing: true })

  assert.match(html, /Refreshing/)
  assert.match(html, /disabled=""/)
})

test('обновление не идёт — кнопка нажимаема', () => {
  assert.doesNotMatch(renderSystem(), /disabled=""/)
})

test('ошибка обновления показывается у своей системы, а не в общем месте', () => {
  const html = renderSystem({}, { refreshError: 'Сервер не знает эту систему.' })

  assert.match(html, /Сервер не знает эту систему\./)
})

test('без ошибки лишнего абзаца в строке нет', () => {
  assert.doesNotMatch(renderSystem(), /text-danger-700/)
})

test('владелец станции показан как факт, без оговорок (36.8)', () => {
  const owned = station()
  owned.station.controllingFaction = { name: 'Aitvas Corp.', allegiance: 'Empire' }

  const html = renderStation(owned, 'empire')

  assert.match(html, /Controlling faction: Aitvas Corp\./)
  assert.match(html, /your side/)
})

test('чужой владелец назван своей стороной, а не «не вашей»', () => {
  const owned = station()
  owned.station.controllingFaction = { name: 'Brothers of Mainani', allegiance: 'Independent' }

  const html = renderStation(owned, 'empire')

  assert.match(html, /Controlling faction: Brothers of Mainani/)
  assert.match(html, /independent/)
  assert.doesNotMatch(html, /your side<\/span>\s*<\/span>Controlling faction/)
})

test('у станции без владельца строки нет вовсе', () => {
  assert.doesNotMatch(renderStation(), /Controlling faction/)
})

test('станция у вторичной звезды отмечена её именем', () => {
  const html = renderStation(
    station({
      station: {
        ...station().station,
        star: { name: 'HIP 6807 B', isMain: false, source: 'dump' as const },
      },
    }),
  )

  assert.match(html, /another star: HIP 6807 B/)
})

test('у главной звезды отметки нет — туда и прилетают', () => {
  const html = renderStation(
    station({
      station: {
        ...station().station,
        star: { name: 'HIP 6807 A', isMain: true, source: 'dump' as const },
      },
    }),
  )

  assert.doesNotMatch(html, /another star/)
})

test('без звезды отметки нет, и строка выглядит как прежде', () => {
  assert.doesNotMatch(renderStation(), /another star/)
})

test('заблокированная станция помечена словами, а не только исчезновением (96)', () => {
  const html = renderStation(station({ rating: 'blocked' }))

  assert.match(html, /blocked/)
  assert.match(html, /does not raise the system/)
})

test('сырое значение оценки на экран не попадает (96)', () => {
  const html = renderStation(station({ rating: 'good' }))

  assert.match(html, /your rating: good/)
  assert.doesNotMatch(html, / · good/)
})
