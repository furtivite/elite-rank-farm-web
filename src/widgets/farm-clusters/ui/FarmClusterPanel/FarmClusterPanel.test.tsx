import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { SavedFarmCluster } from '@/entities/farm-cluster'
import type { ClusterSearchMode } from '@/features/farm-recommender'
import { FarmClusterPanel } from '@/widgets/farm-clusters'

const cluster: SavedFarmCluster = {
  id: 'c1',
  name: 'Imperial — Ngalinn cluster',
  region: 'imperial',
  centerSystem: 'Ngalinn',
  radiusLy: 25,
  createdAt: '2026-09-04T10:00:00.000Z',
  updatedAt: '2026-09-04T10:00:00.000Z',
}

function render(overrides: Partial<React.ComponentProps<typeof FarmClusterPanel>> = {}): string {
  return renderToStaticMarkup(
    React.createElement(FarmClusterPanel, {
      clusterMode: 'auto' as ClusterSearchMode,
      onClusterModeChange: () => {},
      clusters: [],
      selectedClusterId: null,
      onSelectCluster: () => {},
      draft: null,
      onSave: () => {},
      onRename: () => {},
      onRemove: () => {},
      discovery: {
        status: 'idle' as const,
        errorMessage: null,
        candidates: [],
        discover: async () => {},
        reset: () => {},
      },
      onDiscover: () => {},
      onSaveCandidate: () => {},
      ...overrides,
    }),
  )
}

test('Auto discovery доступен всегда и выбран по умолчанию (23)', () => {
  const html = render({ clusters: [cluster] })

  assert.match(html, /Auto discovery/)
  assert.equal((html.match(/type="radio"/g) ?? []).length, 3)
  assert.doesNotMatch(html, /role="radio/)
  assert.equal((html.match(/checked=""/g) ?? []).length, 1, 'выбран ровно один')
})

test('без сохранённых кластеров панель объясняет, как их завести', () => {
  const html = render()

  assert.match(html, /There are no saved clusters in this region/)
  assert.doesNotMatch(html, /<select/)
})

test('выбранный кластер показывает свою область и действия', () => {
  const html = render({ clusters: [cluster], selectedClusterId: 'c1' })

  assert.match(html, /Center Ngalinn · radius 25 ly/)
  assert.match(html, /Rename/)
  assert.match(html, /Delete/)
})

test('«Остаться в кластере» без выбора говорит, чем это кончится', () => {
  const html = render({ clusterMode: 'stay', clusters: [cluster] })

  assert.match(html, /the search runs by jump range/)
})

test('сохранять нечего, пока не было поиска', () => {
  const html = render()

  assert.match(html, /save an area as a cluster after a search/)
  assert.doesNotMatch(html, /Save the area as a cluster/)
})

test('после поиска предлагается сохранить именно его область', () => {
  const html = render({
    draft: {
      name: 'Imperial — Ngalinn cluster',
      region: 'imperial',
      centerSystem: 'Ngalinn',
      radiusLy: 40,
    },
  })

  assert.match(html, /Save the area as a cluster/)
})

test('режимы обведены так же, как Farm Mode, и переносятся на узком', () => {
  const html = render({ clusters: [cluster] })
  const fieldset = /<fieldset[\s\S]*?<\/fieldset>/.exec(html)

  assert.ok(fieldset, 'группа обязана быть fieldset')
  assert.equal((fieldset[0].match(/rounded-md border/g) ?? []).length, 4)
  assert.match(fieldset[0], /border-aubergine-700/)
  assert.match(fieldset[0], /flex-wrap/)
  assert.match(fieldset[0], /basis-32/)
  assert.match(fieldset[0], /min-w-0/)
})

test('у группы есть своя рамка и видимая подпись', () => {
  const html = render({ clusters: [cluster] })
  const fieldset = /<fieldset[^>]*>/.exec(html)

  assert.ok(fieldset)
  assert.match(fieldset[0], /rounded-md border border-warm-300/)
  assert.match(fieldset[0], /dark:border-warm-600/)
  assert.doesNotMatch(html, /<legend[^>]*sr-only/)
  assert.match(html, /<legend[^>]*>Режим кластеров<\/legend>|<legend[^>]*>Cluster mode<\/legend>/)
})
