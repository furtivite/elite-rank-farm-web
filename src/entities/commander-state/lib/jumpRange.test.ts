import assert from 'node:assert/strict'
import { test } from 'node:test'
import { estimateJumpRange } from '@/entities/commander-state/lib/jumpRange'

const type9 = {
  unladenMassT: 1256.199951,
  fuelCapacityT: 64,
  cargoCapacityT: 724,
  fsdSymbol: 'int_hyperdrive_overcharge_size6_class5',
  fsdOptimalMassT: 3224,
  fsdBoosterSymbol: 'int_guardianfsdbooster_size4',
}

test('лучшая дальность совпадает с MaxJumpRange из журнала', () => {
  const estimate = estimateJumpRange(type9)

  assert.ok(estimate)
  assert.equal(estimate.bestLy.toFixed(4), '39.8255')
})

test('полный трюм отнимает больше трети дальности', () => {
  const estimate = estimateJumpRange(type9)

  assert.ok(estimate)
  assert.equal(estimate.ladenLy.toFixed(2), '28.16')
  assert.ok(estimate.bestLy - estimate.ladenLy > 11)
})

test('нынешняя загрузка считается по топливу и грузу', () => {
  const estimate = estimateJumpRange({ ...type9, fuelLevelT: 42.8, cargoT: 300 })

  assert.ok(estimate)
  assert.equal(estimate.currentMassT.toFixed(1), '1599.0')
  assert.ok(estimate.currentLy < estimate.bestLy)
  assert.ok(estimate.currentLy > estimate.ladenLy)
  assert.equal(estimate.cargoKnown, true)
  assert.equal(estimate.fuelKnown, true)
})

test('чего не знаем — не выдумываем: груз считается пустым, бак полным', () => {
  const estimate = estimateJumpRange(type9)

  assert.ok(estimate)
  assert.equal(estimate.cargoKnown, false)
  assert.equal(estimate.fuelKnown, false)
  assert.equal(estimate.currentMassT.toFixed(1), '1320.2')
})

test('незнакомый привод не подменяется похожим', () => {
  assert.equal(estimateJumpRange({ ...type9, fsdSymbol: 'int_hyperdrive_size99_class9' }), null)
  assert.equal(estimateJumpRange({ ...type9, fsdSymbol: undefined }), null)
  assert.equal(estimateJumpRange(null), null)
})

test('без бустера дальность ниже ровно на его прибавку', () => {
  const withBooster = estimateJumpRange(type9)
  const without = estimateJumpRange({ ...type9, fsdBoosterSymbol: undefined })

  assert.ok(withBooster && without)
  assert.equal((withBooster.bestLy - without.bestLy).toFixed(2), '9.25')
})

test('инженерия учитывается: без неё привод слабее', () => {
  const stock = estimateJumpRange({ ...type9, fsdOptimalMassT: undefined })

  assert.ok(stock)
  assert.ok(stock.bestLy < 30)
})
