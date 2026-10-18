import assert from 'node:assert/strict'
import { test } from 'node:test'
import { estimateJumpRange } from '@/entities/commander-state'

const type9 = {
  unladenMassT: 1256.199951,
  fuelCapacityT: 64,
  cargoCapacityT: 724,
  fsdSymbol: 'int_hyperdrive_overcharge_size6_class5',
  fsdOptimalMassT: 3224,
  fsdBoosterSymbol: 'int_guardianfsdbooster_size4',
}

test('гружёный корабль летит короче, чем обещает максимум сборки', () => {
  const empty = estimateJumpRange({ ...type9, fuelLevelT: 64, cargoT: 0 })
  const laden = estimateJumpRange({ ...type9, fuelLevelT: 64, cargoT: 720 })

  assert.ok(empty && laden)
  assert.ok(laden.currentLy < empty.currentLy)
  assert.ok(empty.currentLy - laden.currentLy > 10)
})

test('16 световых лет гружёному каттеру — два прыжка, а не один (90.5)', () => {
  const cutter = {
    unladenMassT: 1584,
    fuelCapacityT: 64,
    cargoCapacityT: 720,
    fsdSymbol: 'int_hyperdrive_overcharge_size7_class5',
  }

  const best = estimateJumpRange({ ...cutter, fuelLevelT: 64, cargoT: 0 })
  const laden = estimateJumpRange({ ...cutter, fuelLevelT: 52.59, cargoT: 720 })

  assert.ok(best && laden)
  assert.equal(best.bestLy.toFixed(2), '23.22')
  assert.equal(laden.currentLy.toFixed(2), '15.74')

  const distanceLy = 16
  assert.equal(Math.ceil(distanceLy / best.bestLy), 1, 'по максимуму выходил один прыжок')
  assert.equal(
    Math.ceil(distanceLy / laden.currentLy),
    2,
    'по действительной дальности — два, как и было в игре',
  )
})
