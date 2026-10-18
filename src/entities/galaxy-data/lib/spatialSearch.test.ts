import assert from 'node:assert/strict'
import { test } from 'node:test'
import { distanceLy, findSystemsWithinRadius } from '@/entities/galaxy-data/lib/spatialSearch'
import type { SystemIndexEntry } from '@/entities/galaxy-data/model/types'

test('distanceLy считает евклидово расстояние по x/y/z (6.10)', () => {
  assert.equal(distanceLy({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }), 5)
  assert.equal(distanceLy({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }), 0)
})

const SYSTEMS: SystemIndexEntry[] = [
  { id: 'center', name: 'Ngalinn', x: 0, y: 0, z: 0, chunk: 'chunks/chunk-001.json' },
  { id: 'near', name: 'Near System', x: 10, y: 0, z: 0, chunk: 'chunks/chunk-001.json' },
  { id: 'far', name: 'Far System', x: 1000, y: 0, z: 0, chunk: 'chunks/chunk-001.json' },
  { id: 'diagonal-out', name: 'Diagonal Out', x: 30, y: 30, z: 0, chunk: 'chunks/chunk-001.json' },
]

test('findSystemsWithinRadius исключает системы вне радиуса и сортирует по расстоянию', () => {
  const result = findSystemsWithinRadius(SYSTEMS, { x: 0, y: 0, z: 0 }, 40)

  const ids = result.map((system) => system.id)
  assert.deepEqual(ids, ['center', 'near'])
  assert.equal(result[0].distanceLy, 0)
  assert.equal(result[1].distanceLy, 10)
})

test('findSystemsWithinRadius не путает bounding box с точным расстоянием', () => {
  const result = findSystemsWithinRadius(SYSTEMS, { x: 0, y: 0, z: 0 }, 40)
  assert.ok(!result.some((system) => system.id === 'diagonal-out'))
})
