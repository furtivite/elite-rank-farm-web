import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import {
  _resetPinStoreForTests,
  getPinSnapshot,
  writePin,
} from '@/features/next-destination/model/pinStore'
import { useDropPinWhenGone } from '@/features/next-destination/model/useDropPinWhenGone'

function Probe({ keys, known }: { keys: string[]; known: boolean }) {
  useDropPinWhenGone(keys, known)
  return null
}

async function renderProbe(keys: string[], known: boolean): Promise<void> {
  const view = await renderInDom(React.createElement(Probe, { keys, known }))
  view.unmount()
}

beforeEach(() => {
  _resetPinStoreForTests()
  writePin({ systemKey: 'ngalinn', stationKey: null })
})

test('все задания системы сданы — закрепление снимается', async () => {
  await renderProbe(['mainani'], true)

  assert.equal(getPinSnapshot(), null)
})

test('корзина ещё не прочитана — закрепление живо', async () => {
  await renderProbe([], false)

  assert.deepEqual(getPinSnapshot(), { systemKey: 'ngalinn', stationKey: null })
})

test('система в корзине есть — закрепление не трогается', async () => {
  await renderProbe(['mainani', 'ngalinn'], true)

  assert.deepEqual(getPinSnapshot(), { systemKey: 'ngalinn', stationKey: null })
})
