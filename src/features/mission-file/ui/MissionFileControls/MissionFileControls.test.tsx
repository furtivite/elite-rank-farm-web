import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import { serializeMissionsForExport, type StoredMission } from '@/entities/mission-store'
import { MissionFileControls } from '@/features/mission-file'

const mission: StoredMission = {
  id: 'm1',
  targetSystem: 'Ngalinn',
  targetStation: 'Hickam Survey',
  addedAt: '2026-09-03T10:00:00.000Z',
}

function fileWith(text: string): File {
  return new File([text], 'elite-missions.json', { type: 'application/json' })
}

function render(onReplaceAll: (missions: StoredMission[]) => void = () => {}) {
  return renderInDom(
    React.createElement(MissionFileControls, { missions: [mission], onReplaceAll }),
  )
}

test('годный файл заменяет корзину', async () => {
  const replaced: StoredMission[][] = []
  const view = await render((missions) => replaced.push(missions))

  await view.chooseFile(
    view.container.querySelector('input[type="file"]'),
    fileWith(serializeMissionsForExport([mission])),
  )

  assert.equal(replaced.length, 1)
  assert.equal(replaced[0][0].targetSystem, 'Ngalinn')
  view.unmount()
})

test('чужой файл не трогает корзину и объясняет, что не так', async () => {
  const replaced: StoredMission[][] = []
  const view = await render((missions) => replaced.push(missions))

  await view.chooseFile(view.container.querySelector('input[type="file"]'), fileWith('не json'))

  assert.equal(replaced.length, 0, 'корзина не тронута')
  assert.match(view.html(), /role="alert"/)
  view.unmount()
})

test('пустой файл — своё сообщение, а не то же самое', async () => {
  const view = await render()

  await view.chooseFile(
    view.container.querySelector('input[type="file"]'),
    fileWith(serializeMissionsForExport([])),
  )

  const empty = view.html()
  assert.match(empty, /role="alert"/)
  assert.doesNotMatch(empty, /not valid JSON/i)
  view.unmount()
})

test('после годного файла прежняя ошибка уходит', async () => {
  const view = await render()
  const input = view.container.querySelector('input[type="file"]')

  await view.chooseFile(input, fileWith('мусор'))
  assert.match(view.html(), /role="alert"/)

  await view.chooseFile(input, fileWith(serializeMissionsForExport([mission])))
  assert.doesNotMatch(view.html(), /role="alert"/, 'сообщение о прошлой ошибке снято')
  view.unmount()
})

test('кнопка сохранения выключена, когда сохранять нечего', async () => {
  const view = await renderInDom(
    React.createElement(MissionFileControls, { missions: [], onReplaceAll: () => {} }),
  )

  assert.match(view.html(), /disabled/)
  view.unmount()
})
