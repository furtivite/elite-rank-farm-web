import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeBasePath, withBasePath } from '@/shared/config/basePath'

test('нормализует базовый путь к виду /segment', () => {
  assert.equal(normalizeBasePath(''), '')
  assert.equal(normalizeBasePath('/'), '')
  assert.equal(normalizeBasePath('  '), '')
  assert.equal(normalizeBasePath('elite'), '/elite')
  assert.equal(normalizeBasePath('/elite'), '/elite')
  assert.equal(normalizeBasePath('/elite/'), '/elite')
  assert.equal(normalizeBasePath('/elite/app/'), '/elite/app')
})

test('без базового пути адреса не меняются', () => {
  assert.equal(withBasePath('/data/manifest.json'), '/data/manifest.json')
  assert.equal(withBasePath('/api/elite/state'), '/api/elite/state')
})

test('путь без ведущего слэша всё равно даёт корректный адрес', () => {
  assert.equal(withBasePath('data/manifest.json'), '/data/manifest.json')
})
