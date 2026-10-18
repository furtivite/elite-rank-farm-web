import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cellsAround, nameBucket, NAME_BUCKETS } from '@/entities/galaxy-data/lib/cells'

const KNOWN: ReadonlyArray<[string, string]> = [
  ['Sol', '41'],
  ['Ngalinn', '0e'],
  ['Canopus', '9a'],
  ['Cephei Sector HW-W b1-3', '8d'],
  ['Slegi IF-R a100-0', '2e'],
]

test('имена раскладываются по тем же частям, что и на сервере', () => {
  for (const [name, bucket] of KNOWN) {
    assert.equal(nameBucket(name), bucket, name)
  }
})

test('номер части всегда двузначный', () => {
  assert.equal(nameBucket('A').length, 2)
  assert.equal(nameBucket('Sol').length, 2)
})

test('число частей то же, что у публикатора', () => {
  assert.equal(NAME_BUCKETS, 256)
})

test('число частей приходит снаружи, когда снимок говорит другое', () => {
  assert.notEqual(nameBucket('Sol', 16), nameBucket('Sol', 256))
})

test('ячейка в углу куба, до которой сфера не достаёт, не берётся', () => {
  const cells = cellsAround({ x: 50, y: 50, z: 50 }, 30, 100)

  assert.ok(
    cells.some((cell) => cell.join() === '0,0,0'),
    'своя ячейка обязана быть',
  )
  assert.equal(cells.length, 1, 'ни одна соседняя сюда не попадает')
})

test('соседняя ячейка берётся, когда сфера её задевает', () => {
  const cells = cellsAround({ x: 95, y: 50, z: 50 }, 10, 100)

  assert.ok(cells.some((cell) => cell.join() === '0,0,0'))
  assert.ok(cells.some((cell) => cell.join() === '1,0,0'))
})

test('ни одна точка внутри сферы не остаётся без своей ячейки', () => {
  const center = { x: 137.5, y: -62.25, z: 8 }
  const radius = 130
  const cellLy = 50
  const cells = new Set(cellsAround(center, radius, cellLy).map((cell) => cell.join()))

  for (let dx = -radius; dx <= radius; dx += 10) {
    for (let dy = -radius; dy <= radius; dy += 10) {
      for (let dz = -radius; dz <= radius; dz += 10) {
        if (dx * dx + dy * dy + dz * dz > radius * radius) {
          continue
        }

        const point = { x: center.x + dx, y: center.y + dy, z: center.z + dz }
        const cell = [
          Math.floor(point.x / cellLy),
          Math.floor(point.y / cellLy),
          Math.floor(point.z / cellLy),
        ].join()

        assert.ok(cells.has(cell), `точка ${dx},${dy},${dz} осталась без ячейки ${cell}`)
      }
    }
  }
})

test('просеивание и правда убирает лишнее', () => {
  const cells = cellsAround({ x: 137.5, y: -62.25, z: 8 }, 130, 50)
  const cube = 7 * 7 * 7

  assert.ok(cells.length < cube, `${cells.length} против ${cube} в кубе`)
})
