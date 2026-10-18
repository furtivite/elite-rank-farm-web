import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SystemAgeBadge } from '@/widgets/farm-navigator/ui/SystemAgeBadge/SystemAgeBadge'
import type { DataSource } from '@/entities/galaxy-data'

const NOW = Date.parse('2026-09-07T12:00:00Z')
const LONG_AGO = '2026-01-01T12:00:00Z'

function render(updatedAt: string | undefined, updatedBy?: DataSource): string {
  return renderToStaticMarkup(
    React.createElement(SystemAgeBadge, { updatedAt, now: NOW, updatedBy }),
  )
}

test('свежие данные метки не получают', () => {
  assert.equal(render('2026-09-06T12:00:00Z'), '')
})

test('без метки времени предупреждения нет: unknown — не «плохо» (30)', () => {
  assert.equal(render(undefined), '')
})

test('источник неизвестен — говорится только возраст, без выдумок', () => {
  const html = render(LONG_AGO)

  assert.match(html, /data /)
  assert.doesNotMatch(html, /from the game|external data/)
})

test('наблюдение из игры названо своим словом (102.6)', () => {
  assert.match(render(LONG_AGO, 'journal'), /from the game/)
})

test('внешние данные названы своим словом', () => {
  assert.match(render(LONG_AGO, 'external'), /external data/)
})

test('данные из первой сборки названы своим словом', () => {
  assert.match(render(LONG_AGO, 'builder'), /from the first build/)
})

test('источник не превращает свежие данные в предупреждение', () => {
  assert.equal(render('2026-09-06T12:00:00Z', 'builder'), '')
})
