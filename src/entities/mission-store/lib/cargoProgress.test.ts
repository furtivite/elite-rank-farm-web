import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cargoProgress } from '@/entities/mission-store/lib/cargoProgress'

const CARGO = { total: 6004, delivered: 3600, collected: 3600 }

test('остаток и рейсы считаются от того, что ещё не сдано', () => {
  const progress = cargoProgress(CARGO, 720)

  assert.equal(progress.remaining, 2404)
  assert.equal(progress.inHold, 0)
  assert.equal(progress.toCollect, 2404)
  assert.equal(progress.runsLeft, 4)
})

test('то, что уже в трюме, своей ходки не требует', () => {
  const progress = cargoProgress({ ...CARGO, collected: 3700 }, 720)

  assert.equal(progress.inHold, 100)
  assert.equal(progress.toCollect, 2304)
  assert.equal(progress.runsLeft, 4)
})

test('без вместимости трюма рейсы не выдумываются', () => {
  const progress = cargoProgress(CARGO, undefined)

  assert.equal(progress.remaining, 2404)
  assert.equal(progress.toCollect, 2404)
  assert.equal(progress.runsLeft, null)
})

test('потерянное вместе с кораблём не считается везущимся', () => {
  const progress = cargoProgress({ total: 6004, delivered: 2880, collected: 3600, lost: 720 }, 720)

  assert.equal(progress.inHold, 0, 'трюм пуст — груз погиб вместе с кораблём')
  assert.equal(progress.lost, 720)
  assert.equal(progress.remaining, 3124)
  assert.equal(progress.runsLeft, 5)
})

test('склада не было — про трюм молчим, остаток считаем', () => {
  const progress = cargoProgress({ total: 720 }, 720)

  assert.equal(progress.remaining, 720)
  assert.equal(progress.inHold, 0)
  assert.equal(progress.runsLeft, 1)
})

test('всё сдано — рейсов не осталось', () => {
  const progress = cargoProgress({ total: 6004, delivered: 6004, collected: 6004 }, 720)

  assert.equal(progress.remaining, 0)
  assert.equal(progress.toCollect, 0)
  assert.equal(progress.runsLeft, 0)
})

test('в трюме не больше, чем осталось довезти', () => {
  const progress = cargoProgress({ total: 100, delivered: 0, collected: 500 }, 720)

  assert.equal(progress.inHold, 100)
  assert.equal(progress.toCollect, 0, 'везти со склада больше нечего')
  assert.equal(progress.runsLeft, 0)
})
