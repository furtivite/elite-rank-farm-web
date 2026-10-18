import assert from 'node:assert/strict'
import { test } from 'node:test'
import { en } from '@/shared/lib/i18n/dictionary/en'
import { ru } from '@/shared/lib/i18n/dictionary/ru'
import { createTranslate } from '@/shared/lib/i18n/useTranslation'

test('оба словаря знают одни и те же ключи', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort())
})

test('в словаре нет пустых строк', () => {
  for (const [key, value] of Object.entries({ ...en, ...ru })) {
    assert.notEqual(value.trim(), '', `пустая строка у ключа ${key}`)
  }
})

test('подстановка заменяет все вхождения', () => {
  const t = createTranslate('ru')

  assert.equal(t('app.skipTo.results', { section: 'Поиск и выдача' }), 'К разделу «Поиск и выдача»')
})

test('множественное число: число и форма вместе', () => {
  assert.equal(createTranslate('ru').plural('plural.missions', 2), '2 миссии')
  assert.equal(createTranslate('en').plural('plural.missions', 2), '2 missions')
  assert.equal(createTranslate('ru').plural('plural.jumps', 5), '5 прыжков')
})

test('английский по умолчанию — решение пользователя', () => {
  assert.equal(createTranslate('en')('nav.signIn'), 'Sign in')
  assert.equal(createTranslate('ru')('nav.signIn'), 'Войти')
})
