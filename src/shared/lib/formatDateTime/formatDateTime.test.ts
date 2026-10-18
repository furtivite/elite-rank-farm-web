import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDateTime } from '@/shared/lib/formatDateTime'

const MOMENT = Date.parse('2026-09-07T14:30:00Z')

test('русский и английский форматы различаются', () => {
  const ru = formatDateTime(MOMENT, 'ru')
  const en = formatDateTime(MOMENT, 'en')

  assert.notEqual(ru, en, 'один и тот же формат на оба языка — это и был баг')
})

test('русский формат — день, месяц по-русски', () => {
  const formatted = formatDateTime(MOMENT, 'ru')

  assert.match(formatted, /7 сент/)
  assert.match(formatted, /2026/)
})

test('английский формат — месяц по-английски, порядок американский', () => {
  const formatted = formatDateTime(MOMENT, 'en')

  assert.match(formatted, /Sep 7, 2026/)
})

test('время показывается в обоих языках', () => {
  for (const language of ['ru', 'en'] as const) {
    assert.match(formatDateTime(MOMENT, language), /\d{1,2}:\d{2}/)
  }
})
