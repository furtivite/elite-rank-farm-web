import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as storageKeys from '@/shared/config/storageKeys'

const allKeys = Object.values<unknown>(storageKeys).filter(
  (value): value is string => typeof value === 'string',
)

test('о каждом ключе хранилища уведомление говорит', () => {
  const described = new Set(storageKeys.STORAGE_NOTES.map((note) => note.key))

  assert.deepEqual(
    allKeys.filter((key) => !described.has(key)),
    [],
  )
})

test('в уведомлении нет ключей, которых больше нет в коде', () => {
  const known = new Set(allKeys)

  assert.deepEqual(
    storageKeys.STORAGE_NOTES.filter((note) => !known.has(note.key)).map((note) => note.key),
    [],
  )
})

test('каждый ключ назван по-человечески, а не своим именем', () => {
  for (const note of storageKeys.STORAGE_NOTES) {
    assert.notEqual(note.what.trim(), '')
    assert.doesNotMatch(note.what, /elite:/)
  }
})
