import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MissionCycles } from '@/widgets/mission-basket/ui/MissionCycles'
import type { JournalMission } from '@/entities/mission-store'

function mission(
  missionId: string,
  from: [string, string],
  to: [string, string],
  cargo?: JournalMission['cargo'],
): JournalMission {
  return {
    missionId,
    name: 'Mission_Delivery',
    acceptedAt: '2026-09-08T18:00:00Z',
    detailsKnown: true,
    originSystem: from[0],
    originStation: from[1],
    destinationSystem: to[0],
    destinationStation: to[1],
    cargo,
  }
}

const A: [string, string] = ['Ngalinn', 'Hickam Survey']
const B: [string, string] = ['Mainani', 'Kirk Dock']

const render = (
  missions: JournalMission[],
  position?: { systemName: string; stationName: string | null } | null,
) => renderToStaticMarkup(React.createElement(MissionCycles, { missions, position }))

function isCurrentLeg(html: string, from: string, to: string): boolean {
  const leg = `${from} → ${to}</span>`
  const at = html.indexOf(leg)
  if (at === -1) {
    return false
  }

  const rest = html.slice(at + leg.length)
  return rest.slice(0, rest.indexOf('</li>')).includes('current leg')
}

test('пара «туда и обратно» показана группой с маршрутом', () => {
  const html = render([mission('1', A, B), mission('2', B, A)])

  assert.match(html, /Round trips/)
  assert.match(html, /Hickam Survey/)
  assert.match(html, /Kirk Dock/)
  assert.match(html, /rounded-md border/)
  assert.match(html, /aria-label="Round trip: /)
})

test('без колец блока нет вовсе', () => {
  assert.equal(render([mission('1', A, B)]), '')
})

test('плашка стоит на том плече, чей груз в трюме', () => {
  const carrying = mission('2', B, A, { total: 100, collected: 60, delivered: 0 })
  const html = render([mission('1', A, B), carrying], {
    systemName: 'Ngalinn',
    stationName: 'Hickam Survey',
  })

  assert.ok(isCurrentLeg(html, 'Kirk Dock', 'Hickam Survey'))
  assert.ok(!isCurrentLeg(html, 'Hickam Survey', 'Kirk Dock'))
})

test('цепочка с порожним возвратом показана кольцом (114.1)', () => {
  const HIP: [string, string] = ['HIP 11241', 'Esposito City']
  const TULL: [string, string] = ['Col 285 Sector SX-B b13-2', 'Tull Reach']
  const WAX: [string, string] = ['Col 285 Sector MH-M c7-5', 'Waxwizard Hub']
  const missions = [
    mission('1', HIP, TULL, { total: 5868, collected: 3120, delivered: 3120 }),
    mission('2', TULL, WAX, { total: 5962, collected: 3120, delivered: 3120 }),
  ]

  const html = render(missions, { systemName: WAX[0], stationName: WAX[1] })

  assert.match(html, /Esposito City → Tull Reach → Waxwizard Hub → Esposito City/)
  assert.match(html, /empty run back/)
  assert.ok(isCurrentLeg(html, 'Waxwizard Hub', 'Esposito City'))
  assert.ok(!isCurrentLeg(html, 'Esposito City', 'Tull Reach'))
})

test('плашка переезжает вслед за командиром', () => {
  const missions = [mission('1', A, B), mission('2', B, A)]

  const atA = render(missions, { systemName: 'Ngalinn', stationName: 'Hickam Survey' })
  assert.ok(isCurrentLeg(atA, 'Hickam Survey', 'Kirk Dock'))

  const atB = render(missions, { systemName: 'Mainani', stationName: 'Kirk Dock' })
  assert.ok(isCurrentLeg(atB, 'Kirk Dock', 'Hickam Survey'))
})
