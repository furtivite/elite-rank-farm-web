import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseStoredClusters, serializeClusters } from '@/entities/farm-cluster/model/validate'
import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

function cluster(overrides: Partial<SavedFarmCluster> = {}): SavedFarmCluster {
  return {
    id: 'c1',
    name: 'Imperial — Ngalinn cluster',
    region: 'imperial',
    centerSystem: 'Ngalinn',
    radiusLy: 25,
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
    ...overrides,
  }
}

test('пустое и чужое хранилище читается как пустой список', () => {
  assert.deepEqual(parseStoredClusters(null), [])
  assert.deepEqual(parseStoredClusters({ version: 99, clusters: [cluster()] }), [])
  assert.deepEqual(parseStoredClusters({ version: 1, clusters: 'нет' }), [])
})

test('кластер переживает сериализацию', () => {
  const parsed = parseStoredClusters(JSON.parse(serializeClusters([cluster()])))

  assert.deepEqual(parsed, [cluster()])
})

test('одна повреждённая запись не стирает остальные', () => {
  const parsed = parseStoredClusters({
    version: 1,
    clusters: [cluster(), { id: 'c2', name: 'Без центра' }, cluster({ id: 'c3' })],
  })

  assert.deepEqual(
    parsed.map((entry) => entry.id),
    ['c1', 'c3'],
  )
})

test('негодный радиус и чужой регион отбрасываются', () => {
  const parsed = parseStoredClusters({
    version: 1,
    clusters: [
      cluster({ id: 'zero', radiusLy: 0 }),
      cluster({ id: 'nan', radiusLy: Number.NaN }),
      cluster({ id: 'alien', region: 'alliance' as SavedFarmCluster['region'] }),
      cluster({ id: 'blank', name: '   ' }),
      cluster({ id: 'ok' }),
    ],
  })

  assert.deepEqual(
    parsed.map((entry) => entry.id),
    ['ok'],
  )
})
