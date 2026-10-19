import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderInDom } from '@/shared/test/renderInDom'
import { returnLegKey, writeReturnLegs } from '@/entities/mission-store'
import { MissionReturnControls } from '@/widgets/mission-basket/ui/MissionReturnControls'

const target = { systemName: 'HIP 8060', stationName: 'Fernandes Base' }
const docked = { currentSystem: 'Ngalinn', currentStation: 'Gloss Gateway' }

afterEach(() => {
  writeReturnLegs({})
})

function renderFirstFrame(at: { currentSystem: string | null; currentStation: string | null }) {
  return renderToStaticMarkup(React.createElement(MissionReturnControls, { ...target, ...at }))
}

async function render(at: { currentSystem: string | null; currentStation: string | null }) {
  const view = await renderInDom(React.createElement(MissionReturnControls, { ...target, ...at }))
  const html = view.html()
  view.unmount()
  return html
}

test('у кнопки только значок, слово — в имени для screen reader', () => {
  const html = renderFirstFrame(docked)

  assert.match(html, /<svg/)
  assert.match(html, /class="sr-only">Return trip from Fernandes Base/)
})

test('вид тот же, что у соседей по строке станции', () => {
  const html = renderFirstFrame(docked)

  assert.match(html, /min-h-8 min-w-8/)
  assert.match(html, /border-warm-500|border-warm-400|border /)
})

test('без связки «+1» не показывается', () => {
  const html = renderFirstFrame(docked)

  assert.doesNotMatch(html, /\+1/)
  assert.match(html, /type="checkbox"/)
  assert.doesNotMatch(html, /checked=""/)
})

test('отмеченная станция показывает «+1» и помнит адрес возврата', async () => {
  writeReturnLegs({
    [returnLegKey(target.systemName, target.stationName)]: {
      systemName: 'Ngalinn',
      stationName: 'Gloss Gateway',
    },
  })

  const html = await render(docked)

  assert.match(html, /\+1/)
  assert.equal((html.match(/checked=""/g) ?? []).length, 1, 'отмечена только первая')
})

test('включённый «+1» отмечен для screen reader, а не только рамкой', async () => {
  writeReturnLegs({
    [returnLegKey(target.systemName, target.stationName)]: {
      systemName: 'Ngalinn',
      stationName: 'Gloss Gateway',
      extraRun: true,
    },
  })

  assert.equal(((await render(docked)).match(/checked=""/g) ?? []).length, 2)
})

test('без известной станции кнопки нет вовсе', () => {
  assert.equal(renderFirstFrame({ currentSystem: null, currentStation: null }), '')
})

test('снять пометку можно и без известного положения', async () => {
  writeReturnLegs({
    [returnLegKey(target.systemName, target.stationName)]: {
      systemName: 'Ngalinn',
      stationName: 'Gloss Gateway',
    },
  })

  const html = await render({ currentSystem: null, currentStation: null })
  assert.equal((html.match(/checked=""/g) ?? []).length, 1, html)
  assert.doesNotMatch(html, /disabled=""/)
})

test('ключ станции не склеивает соседей', () => {
  assert.notEqual(
    returnLegKey('HIP 8060', 'Fernandes Base'),
    returnLegKey('HIP', '8060 Fernandes Base'),
  )
})
