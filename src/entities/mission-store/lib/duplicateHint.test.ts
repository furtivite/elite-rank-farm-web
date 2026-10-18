import assert from 'node:assert/strict'
import { test } from 'node:test'
import { journalTargets, looksLikeDuplicate } from '@/entities/mission-store/lib/duplicateHint'
import type { StoredMission } from '@/entities/mission-store/model/types'

function mission(targetSystem: string, targetStation: string): StoredMission {
  return { id: `${targetSystem}/${targetStation}`, targetSystem, targetStation, addedAt: '' }
}

test('цель, о которой игра уже знает, помечается как похожая на дубль (70.2)', () => {
  const targets = journalTargets([mission('HIP 8060', 'Fernandes Base')])

  assert.equal(looksLikeDuplicate(targets, 'HIP 8060', 'Fernandes Base'), true)
})

test('регистр и лишние пробелы не мешают узнать ту же станцию', () => {
  const targets = journalTargets([mission('HIP 8060', 'Fernandes Base')])

  assert.equal(looksLikeDuplicate(targets, ' hip 8060 ', 'FERNANDES BASE'), true)
})

test('другая станция той же системы дублем не считается', () => {
  const targets = journalTargets([mission('HIP 8060', 'Fernandes Base')])

  assert.equal(looksLikeDuplicate(targets, 'HIP 8060', 'Sealey Lab'), false)
})

test('без журнальных записей подсказки не бывает', () => {
  assert.equal(looksLikeDuplicate(journalTargets([]), 'HIP 8060', 'Fernandes Base'), false)
})
