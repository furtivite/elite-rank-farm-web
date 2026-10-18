import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeClusters } from '@/entities/farm-cluster/lib/mergeClusters'
import type { SavedFarmCluster } from '@/entities/farm-cluster/model/types'

function cluster(id: string, overrides: Partial<SavedFarmCluster> = {}): SavedFarmCluster {
  return {
    id,
    name: `Кластер ${id}`,
    region: 'imperial',
    centerSystem: 'Ngalinn',
    radiusLy: 40,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-14T10:00:00.000Z',
    ...overrides,
  }
}

test('объединение по id: ничего не теряется (45.6)', () => {
  const merged = mergeClusters([cluster('c1')], [cluster('c2')])

  assert.deepEqual(
    merged.map((item) => item.id),
    ['c1', 'c2'],
  )
})

test('по совпавшему id побеждает более свежий updatedAt', () => {
  const merged = mergeClusters(
    [cluster('c1', { name: 'Старое', updatedAt: '2026-09-13T10:00:00.000Z' })],
    [cluster('c1', { name: 'Новое', updatedAt: '2026-09-15T10:00:00.000Z' })],
  )

  assert.equal(merged.length, 1)
  assert.equal(merged[0]?.name, 'Новое')
})

test('равное время оставляет то, что было', () => {
  const merged = mergeClusters(
    [cluster('c1', { name: 'Местный' })],
    [cluster('c1', { name: 'Серверный' })],
  )

  assert.equal(merged[0]?.name, 'Местный')
})

test('порядок — по созданию, а не по тому, чья копия пришла первой', () => {
  const merged = mergeClusters(
    [cluster('c2', { createdAt: '2026-09-12T10:00:00.000Z' })],
    [cluster('c1', { createdAt: '2026-09-09T10:00:00.000Z' })],
  )

  assert.deepEqual(
    merged.map((item) => item.id),
    ['c1', 'c2'],
  )
})

test('объединение не трогает исходные копии', () => {
  const local = [cluster('c1')]
  const before = JSON.stringify(local)
  mergeClusters(local, [cluster('c1', { name: 'Другое', updatedAt: '2026-09-15T10:00:00.000Z' })])

  assert.equal(JSON.stringify(local), before)
})
