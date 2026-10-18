import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fineForFaction } from '@/entities/commander-state/lib/fines'
import type { UseCommanderStateResult } from '@/entities/commander-state'

function commander(finedFactions: { name: string; observedAt: string }[]): UseCommanderStateResult {
  return { data: { finedFactions } } as unknown as UseCommanderStateResult
}

const FINED = [{ name: 'Nationals of HIP 6108', observedAt: '2026-09-05T15:08:35Z' }]

test('станция фракции со штрафом получает отметку с моментом наблюдения (73)', () => {
  const fine = fineForFaction(commander(FINED), 'Nationals of HIP 6108')

  assert.equal(fine?.observedAt, '2026-09-05T15:08:35Z')
})

test('другая фракция отметки не получает', () => {
  assert.equal(fineForFaction(commander(FINED), 'Earth Defense Fleet'), null)
})

test('имена сравниваются без учёта регистра и краевых пробелов', () => {
  assert.ok(fineForFaction(commander(FINED), '  nationals of hip 6108 '))
})

test('станция без владельца отметки не получает', () => {
  assert.equal(fineForFaction(commander(FINED), undefined), null)
  assert.equal(fineForFaction(commander(FINED), ''), null)
})

test('пустой список штрафов — отметок нет', () => {
  assert.equal(fineForFaction(commander([]), 'Nationals of HIP 6108'), null)
})

test('нет состояния — отметок нет', () => {
  assert.equal(fineForFaction({} as UseCommanderStateResult, 'Nationals of HIP 6108'), null)
})
