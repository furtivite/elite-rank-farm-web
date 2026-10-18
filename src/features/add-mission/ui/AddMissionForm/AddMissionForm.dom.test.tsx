import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderInDom } from '@/shared/test/renderInDom'
import type { MissionTarget } from '@/entities/mission-store'
import { AddMissionForm } from '@/features/add-mission'

function field(container: HTMLElement, label: RegExp): HTMLInputElement | null {
  const labels = Array.from(container.querySelectorAll('label'))
  const found = labels.find((node) => label.test(node.textContent ?? ''))
  const id = found?.getAttribute('for')

  return id === null || id === undefined
    ? null
    : container.querySelector<HTMLInputElement>(`[id="${id}"]`)
}

function withoutDataset(): () => void {
  const original = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response('[]', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch

  return () => {
    globalThis.fetch = original
  }
}

test('пометка очищается после добавления, система остаётся (75.1)', async () => {
  const restoreFetch = withoutDataset()
  const added: MissionTarget[] = []
  const view = await renderInDom(
    React.createElement(AddMissionForm, {
      regionKey: 'imperial' as const,
      isFull: false,
      onAdd: (target: MissionTarget) => {
        added.push(target)
        return 'added' as const
      },
    }),
  )

  const system = field(view.container, /system/i)
  const station = field(view.container, /station/i)
  const note = field(view.container, /note/i)
  assert.ok(system && station && note, 'все три поля на месте')

  await view.type(system, 'Ngalinn')
  await view.type(station, 'Hodgkin Terminal')
  await view.type(note, 'ранговая пачка')

  const submit = view.container.querySelector('button[type="submit"]')
  await view.click(submit)

  assert.equal(added.length, 1, 'задание добавлено')
  assert.equal(added[0]?.note, 'ранговая пачка', 'пометка доехала до записи')

  assert.equal(note.value, '', 'пометка очищена')
  assert.equal(system.value, 'Ngalinn', 'система осталась')
  assert.equal(station.value, '', 'станция очищена — она у каждого задания своя')

  view.unmount()
  restoreFetch()
})
