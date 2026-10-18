import assert from 'node:assert/strict'
import { test } from 'node:test'
import { columnsGridClass } from '@/widgets/app-shell/lib/columnsGridClass'

test('три колонки: средняя вдвое шире крайних', () => {
  const grid = columnsGridClass({ withSettings: true, withResults: true, withAside: true })

  assert.match(grid, /minmax\(0,1fr\)_minmax\(0,2fr\)_minmax\(19rem,1fr\)/)
})

test('две колонки без корзины — пополам', () => {
  const grid = columnsGridClass({ withSettings: true, withResults: true, withAside: false })

  assert.match(grid, /minmax\(0,1fr\)_minmax\(0,1fr\)/)
})

test('у корзины есть нижняя граница ширины', () => {
  for (const columns of [
    { withSettings: true, withResults: false, withAside: true },
    { withSettings: false, withResults: true, withAside: true },
  ]) {
    assert.match(columnsGridClass(columns), /minmax\(19rem,1fr\)/)
  }
})

test('одна колонка занимает всю ширину', () => {
  for (const columns of [
    { withSettings: false, withResults: false, withAside: true },
    { withSettings: false, withResults: true, withAside: false },
    { withSettings: false, withResults: false, withAside: false },
  ]) {
    assert.equal(columnsGridClass(columns), 'lg:grid-cols-1')
  }
})
