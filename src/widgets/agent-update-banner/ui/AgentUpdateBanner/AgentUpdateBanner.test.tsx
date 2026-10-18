import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MOCK_SCENARIOS } from '@/entities/commander-state/model/mockScenarios'
import type { UseCommanderStateResult } from '@/entities/commander-state'
import { AGENT_DOWNLOAD_URL } from '@/shared/config/downloads'
import { ru } from '@/shared/lib/i18n/dictionary/ru'
import { AgentUpdateBanner } from '@/widgets/agent-update-banner'

function commanderFromScenario(id: string): UseCommanderStateResult {
  const scenario = MOCK_SCENARIOS.find((item) => item.id === id)
  assert.ok(scenario, `нет набора ${id}`)

  return {
    status: scenario.status,
    data: scenario.data,
    progress: scenario.progress,
    errorMessage: scenario.errorMessage,
    agentUpdateRequired: scenario.data?.agentUpdateRequired === true,
    isSignedIn: true,
    refresh: () => {},
  } as UseCommanderStateResult
}

function render(id: string): string {
  return renderToStaticMarkup(
    React.createElement(AgentUpdateBanner, { commander: commanderFromScenario(id) }),
  )
}

test('устаревшая сборка — полоса с текстом', () => {
  const html = render('agent-outdated')

  assert.match(html, /A new version of the agent is out/)
})

test('русская формулировка — ровно та, что запросил пользователь', () => {
  assert.equal(
    ru['agent.updateAvailable'],
    'Выложена новая версия агента, скачайте новый агент перед продолжением.',
  )
})

test('полоса ведёт туда, откуда скачивать (69.5)', () => {
  assert.ok(AGENT_DOWNLOAD_URL)
  const html = render('agent-outdated')

  assert.ok(html.includes(`href="${AGENT_DOWNLOAD_URL}"`), html)
  assert.match(html, />Download the new version</)
})

test('свежая сборка — полосы нет вовсе', () => {
  assert.equal(render('docked'), '')
})

test('состояния ещё нет — полосы нет', () => {
  assert.equal(render('no-state'), '')
})

test('гость — полосы нет', () => {
  assert.equal(render('guest'), '')
})

test('ошибка чтения — полосы нет: про агента мы ничего не знаем', () => {
  assert.equal(render('error'), '')
})

test('полоса объявляется как status, а не alert', () => {
  const html = render('agent-outdated')

  assert.match(html, /role="status"/)
})

test('контрастная пара берётся для обеих тем', () => {
  const html = render('agent-outdated')

  assert.match(html, /bg-aubergine-700/)
  assert.match(html, /text-white/)
  assert.match(html, /dark:bg-orange-500/)
  assert.match(html, /dark:text-warm-950/)
})

test('полоса видна и когда состояния нет вовсе (69.5)', () => {
  const html = renderToStaticMarkup(
    React.createElement(AgentUpdateBanner, {
      commander: {
        status: 'not-found',
        data: null,
        progress: null,
        errorMessage: null,
        agentUpdateRequired: true,
        isSignedIn: true,
        refresh: () => {},
      } as UseCommanderStateResult,
    }),
  )

  assert.match(html, /A new version of the agent is out/)
})
