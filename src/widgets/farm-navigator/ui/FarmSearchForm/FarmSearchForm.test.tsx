import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CommanderState } from '@/entities/commander-state'
import type { CompletedSides, FarmMode } from '@/features/farm-recommender'
import { FarmSearchForm } from '@/widgets/farm-navigator'

function render(commanderState: CommanderState | null = null, submitLabel?: string): string {
  return renderToStaticMarkup(
    React.createElement(FarmSearchForm, {
      onSearch: () => {},
      isLoading: false,
      commanderState,
      mode: 'empire' as const,
      onModeChange: () => {},
      submitLabel,
    }),
  )
}

test('кнопка называет то, что произойдёт (23)', () => {
  const html = render(null, 'Сравнить кластеры')

  assert.match(html, /Сравнить кластеры/)
  assert.doesNotMatch(html, /Find stations/)
})

test('порядок: система, уточнения, действие последним (41.20)', () => {
  const html = render()

  const order = ['Current system', 'Advanced settings', 'Orbital only', 'Find stations']
  let previous = -1

  for (const label of order) {
    const index = html.indexOf(label)
    assert.ok(index > previous, `«${label}» стоит не на своём месте`)
    previous = index
  }
})

test('поле системы занимает всю ширину блока (41.20)', () => {
  const html = render()
  const field = html.slice(0, html.indexOf('farm-current-system'))

  assert.match(field.slice(-200), /sm:col-span-3/)
  assert.doesNotMatch(field.slice(-200), /sm:col-span-2/)
})

test('расширенные настройки свёрнуты и показывают свою сводку', () => {
  const html = render()

  assert.match(html, /Empire · 40\u00a0ly · pad any/)
  assert.doesNotMatch(html, /<details open/)
})

test('позиция от агента подставляется и помечается', () => {
  const html = render({
    schemaVersion: 4,
    commanderName: 'Jameson',
    currentSystem: { name: 'Ngalinn', x: 8.6, y: -219.8, z: -60.8 },
    currentStation: null,
    currentBody: null,
    ship: 'python',
    requiredPadSize: 'L',
    jumpRangeLy: 42.7,
    imperialRank: 8,
    imperialProgress: 64,
    imperialProgressAt: '2026-09-03T09:00:00Z',
    federalRank: 2,
    federalProgress: 100,
    federalProgressAt: '2026-09-03T09:00:00Z',
    observedAt: '2026-09-03T12:00:00Z',
  })

  assert.match(html, /value="Ngalinn"/)
  assert.match(html, /Position from the agent/)
  assert.match(html, /value="42"/)
})

test('Farm Mode — нативная радиогруппа, а не кнопки с ролью (41.18, 110)', () => {
  const html = render()

  assert.equal((html.match(/type="radio"/g) ?? []).length, 2)
  assert.doesNotMatch(html, /role="radio/)
  assert.equal((html.match(/checked=""/g) ?? []).length, 1, 'выбран ровно один')

  assert.match(html, /<legend[^>]*>Farm Mode<\/legend>/)

  const names = [...html.matchAll(/name="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(names).size, 1, 'обе кнопки — одна группа')
})

test('Farm Mode: отступ у legend и перенос вместо наезда на узком экране', () => {
  const html = render()
  const fieldset = /<fieldset[\s\S]*?<\/fieldset>/.exec(html)

  assert.ok(fieldset, 'группа обязана быть fieldset')
  assert.match(fieldset[0], /<legend[^>]*class="[^"]*mb-1\.5/)
  assert.match(fieldset[0], /flex-wrap/)
  assert.match(fieldset[0], /basis-32/)
  assert.match(fieldset[0], /min-w-0/)
})

test('у группы Farm Mode есть своя рамка, как у групп в шапке', () => {
  const html = render()
  const fieldset = /<fieldset[^>]*>/.exec(html)

  assert.ok(fieldset, 'группа обязана быть fieldset')
  assert.match(fieldset[0], /rounded-md border border-warm-300/)
  assert.match(fieldset[0], /dark:border-warm-600/)
})

test('квадратик фильтра держится первой строки подписи (86.11)', () => {
  const html = render()
  const boxes = [...html.matchAll(/<label class="([^"]*)"[^>]*>\s*<input type="checkbox"/g)]

  assert.equal(boxes.length, 2, 'фильтров под кнопкой ровно два')
  for (const [, className] of boxes) {
    assert.match(className, /items-start/)
    assert.match(className, /py-3/)
    assert.match(className, /min-h-11/)
  }
  assert.equal((html.match(/class="mt-0\.5 size-4 shrink-0"/g) ?? []).length, 2)
})

function renderModes(mode: FarmMode, completedSides: CompletedSides): string {
  return renderToStaticMarkup(
    React.createElement(FarmSearchForm, {
      onSearch: () => {},
      isLoading: false,
      commanderState: null,
      mode,
      onModeChange: () => {},
      completedSides,
    }),
  )
}

function radio(html: string, value: FarmMode): string {
  const match = html.match(new RegExp(`<input[^>]*value="${value}"[^>]*>`))
  assert.ok(match, `нет кнопки ${value}`)
  return match[0]
}

test('докачанная сторона отключена и названа, вторая выбрана (120)', () => {
  const html = renderModes('federal', { empire: true, federal: false })

  assert.match(radio(html, 'empire'), /disabled/)
  assert.doesNotMatch(radio(html, 'federal'), /disabled/)
  assert.match(radio(html, 'federal'), /checked/)
  assert.match(html, /Empire rank is maxed out/)
})

test('докачаны обе — отключён весь блок (120)', () => {
  const html = renderModes('empire', { empire: true, federal: true })

  assert.match(html, /<fieldset[^>]*disabled/)
  assert.match(html, /Both ranks are maxed out/)
})

test('ничего не докачано — блок как прежде (120)', () => {
  const html = renderModes('empire', { empire: false, federal: false })

  assert.doesNotMatch(html, /<fieldset[^>]*disabled/)
  assert.doesNotMatch(radio(html, 'empire'), /disabled/)
  assert.doesNotMatch(html, /maxed out/)
})
