import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTranslate } from '@/shared/lib/i18n'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MOCK_SCENARIOS } from '@/entities/commander-state/model/mockScenarios'
import { RANK_COUNT, type UseCommanderStateResult } from '@/entities/commander-state'
import { commanderFromScenario } from '@/widgets/commander-panel/ui/CommanderPanel/commanderFixture'
import { CommanderPanel } from '@/widgets/commander-panel'
import { presenceNote } from '@/widgets/commander-panel/lib/presenceNote'
import { progressNote } from '@/widgets/commander-panel/lib/progressNote'

const ru = createTranslate('ru')

function render(commander: UseCommanderStateResult): string {
  return renderToStaticMarkup(React.createElement(CommanderPanel, { commander }))
}

test('состояние командира показывает позицию, корабль и звания', () => {
  const html = render(commanderFromScenario('docked'))

  assert.match(html, /DEMO CMDR/)
  assert.match(html, /Ngalinn/)
  assert.match(html, /Hickam Survey/)
  assert.match(html, /python/)
  assert.match(html, /Imperial Navy/)
})

test('гостю показывается приглашение войти, а не ошибка', () => {
  const html = render(commanderFromScenario('guest'))

  assert.match(html, /Sign in/)
  assert.doesNotMatch(html, /DEMO CMDR/)
})

test('в космосе станция названа отсутствующей, а не пустой строкой', () => {
  const html = render(commanderFromScenario('in-space'))

  assert.match(html, /not docked/)
})

test('процент звания подписан моментом наблюдения (49.2)', () => {
  const html = render(commanderFromScenario('docked'))

  assert.match(html, /64% as of/)
  assert.match(html, /the game updates it when you enter the game/)
})

test('подпись не требует перезапуска игры (49.4)', () => {
  const html = render(commanderFromScenario('docked'))

  assert.doesNotMatch(html, /при запуске/)
})

test('на сотне процент зовёт взять миссию флота (59.6)', () => {
  const html = render(commanderFromScenario('docked'))

  assert.match(html, /take a navy mission/)
})

test('после повышения числа нет вовсе (49.6)', () => {
  const html = render(commanderFromScenario('after-promotion'))

  assert.match(html, /progress unknown since the promotion/)
  assert.doesNotMatch(html, /0%/)
})

test('два повышения за сессию: звание второе, числа нет, момент назван (49.6)', () => {
  const html = render(commanderFromScenario('promoted-twice'))

  assert.match(html, /progress unknown since/)
  assert.doesNotMatch(html, /0%/)
})

test('у максимального звания — только подпись «максимальное звание» (49.7)', () => {
  const html = render(commanderFromScenario('rank-max'))

  assert.match(html, /highest rank/)
  assert.doesNotMatch(html, /the game updates it/)
  assert.doesNotMatch(html, /%/)
})

test('процент уехал из крупной строки в подпись (59.6)', () => {
  const html = render(commanderFromScenario('docked'))

  assert.match(html, /Viscount · rank 8/)
  assert.doesNotMatch(html, /Viscount · 64/)
  assert.match(html, /64% as of/)
})

test('ошибка чтения не стирает прежнее состояние', () => {
  const html = render(commanderFromScenario('error'))

  assert.match(html, /DEMO CMDR/)
  assert.match(html, /The server returned 500/)
})

test('взятое ранговое задание убирает просьбу взять миссию флота (59.6)', () => {
  const hundred = { percent: 100, at: '2026-09-06T01:26:00Z' }

  const note = progressNote(hundred, 9, true, ru)

  assert.doesNotMatch(note, /возьмите миссию флота/)
  assert.match(note, /сдайте его флотскому контакту/)
})

test('без взятого задания просьба остаётся (59.6)', () => {
  const note = progressNote({ percent: 100, at: '2026-09-06T01:26:00Z' }, 9, false, ru)

  assert.match(note, /возьмите миссию флота/)
})

test('ниже сотни ранговое задание на подпись не влияет (59.6)', () => {
  const note = progressNote({ percent: 31, at: '2026-09-06T01:26:00Z' }, 9, true, ru)

  assert.match(note, /игра обновляет его при входе в игру/)
  assert.match(note, /31/)
})

test('порядок ветвей: максимальное звание перекрывает и сотню, и ноль (49.7)', () => {
  const max = RANK_COUNT - 1

  assert.equal(progressNote({ percent: 100, at: null }, max, false, ru), 'максимальное звание')
  assert.equal(progressNote({ percent: 0, at: null }, max, false, ru), 'максимальное звание')
})

test('сотня перекрывает ноль, а ноль — обычную подпись (49.6, 49.7)', () => {
  const at = '2026-09-06T01:26:00Z'

  assert.match(progressNote({ percent: 100, at }, 9, false, ru), /возьмите миссию флота/)
  assert.match(progressNote({ percent: 0, at }, 9, false, ru), /прогресс неизвестен с /)
  assert.match(progressNote({ percent: 1, at }, 9, false, ru), /игра обновляет его/)
})

test('закрытая игра названа словом и временем, а не позицией часовой давности', () => {
  const note = presenceNote({ status: 'gameExited', at: '2026-09-06T21:40:00Z' }, ru)

  assert.match(note ?? '', /игра закрыта в/)
})

test('выключенный агент — это не «игра закрыта»', () => {
  const note = presenceNote({ status: 'agentStopped', at: '2026-09-06T21:40:00Z' }, ru)

  assert.match(note ?? '', /агент выключен в/)
  assert.doesNotMatch(note ?? '', /игра/)
})

test('идущая игра названа входом в неё', () => {
  const note = presenceNote({ status: 'playing', at: '2026-09-06T01:26:00Z' }, ru)

  assert.match(note ?? '', /игра идёт/)
})

test('без сигнала строки нет вовсе (39.6)', () => {
  assert.equal(presenceNote(undefined, ru), null)
})

function withLoadout(loadout: Record<string, unknown> | undefined): UseCommanderStateResult {
  const base = commanderFromScenario('docked')
  const data = base.data
  assert.ok(data)

  return {
    ...base,
    data: {
      ...data,
      state: { ...data.state, jumpRangeLy: 39.83, loadout },
    },
  } as UseCommanderStateResult
}

test('дальность показывается двумя строками: максимум и сейчас (90.3)', () => {
  const html = render(
    withLoadout({
      unladenMassT: 1256.199951,
      fuelCapacityT: 64,
      cargoCapacityT: 724,
      fuelLevelT: 42.8,
      cargoT: 300,
      fsdSymbol: 'int_hyperdrive_overcharge_size6_class5',
      fsdOptimalMassT: 3224,
      fsdBoosterSymbol: 'int_guardianfsdbooster_size4',
    }),
  )

  assert.match(html, /39\.83/)
  assert.match(html, /Range right now/)
  assert.match(html, /build maximum/)
  assert.match(html, /at the current mass of 1599 t/)
  assert.match(html, /3[0-4]\.\d\d/)
})

test('без фактов сборки строки «сейчас» нет вовсе', () => {
  assert.doesNotMatch(render(withLoadout(undefined)), /Range right now/)
})

test('трюм показан как «сейчас / максимум» (просьба пользователя)', () => {
  const html = render(
    withLoadout({
      unladenMassT: 1256.199951,
      fuelCapacityT: 64,
      cargoCapacityT: 724,
      cargoT: 300,
      fsdSymbol: 'int_hyperdrive_overcharge_size6_class5',
      fsdOptimalMassT: 3224,
    }),
  )

  assert.match(html, /Cargo hold/)
  assert.match(html, /300 \/ 724 t/)
})

test('неизвестный груз — прочерк, а не ноль', () => {
  const html = render(withLoadout({ unladenMassT: 1256.2, fuelCapacityT: 64, cargoCapacityT: 724 }))

  assert.match(html, /— \/ 724/)
  assert.match(html, /cargo unknown/)
})

const SIGNATURE: Record<string, RegExp | null> = {
  off: null,
  guest: /Sign in/,
  'no-state': /not sent any state/,
  docked: /Hickam Survey/,
  'in-space': /not docked/,
  'empty-search': /Deep space/,
  'after-promotion': /progress unknown since the promotion/,
  'promoted-twice': /progress unknown since Sep 3/,
  'rank-max': /highest rank/,
  federal: /Canopus/,
  'empire-completed': /Duke/,
  'fined-faction': /Ngalinn/,
  'big-ship': /type9/,
  'agent-outdated': /DEMO CMDR/,
  'journal-basket': /DEMO CMDR/,
  'journal-partial': /DEMO CMDR/,
  'journal-cargo': /Mainani/,
  'journal-cargo-untouched': /DEMO CMDR/,
  'journal-wing-ring': /DEMO CMDR/,
  'journal-collect-awaiting': /DEMO CMDR/,
  'manual-basket': /DEMO CMDR/,
  'mixed-basket': /DEMO CMDR/,
  'duplicate-basket': /DEMO CMDR/,
  'game-running': /game running/i,
  'agent-silent': /has not checked in/,
  error: /500/,
}

test('каждый набор рисует то, ради чего заведён (62.6)', () => {
  for (const scenario of MOCK_SCENARIOS) {
    const html = render(commanderFromScenario(scenario.id))
    const signature = SIGNATURE[scenario.id]

    assert.ok(
      signature !== undefined,
      `набор ${scenario.id} не описан в списке: добавьте строку и проверьте его глазами`,
    )

    if (signature === null) {
      continue
    }

    assert.match(html, signature, `набор ${scenario.id} не показывает того, ради чего заведён`)
  }
})

test('ни один набор не роняет панель', () => {
  for (const scenario of MOCK_SCENARIOS) {
    assert.doesNotThrow(() => render(commanderFromScenario(scenario.id)), `набор ${scenario.id}`)
  }
})
