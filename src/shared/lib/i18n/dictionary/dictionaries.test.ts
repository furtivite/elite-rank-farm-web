import assert from 'node:assert/strict'
import { test } from 'node:test'
import { en, enPlurals } from '@/shared/lib/i18n/dictionary/en'
import { ru, ruPlurals } from '@/shared/lib/i18n/dictionary/ru'

const placeholders = (value: string): string[] =>
  [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

test('наборы ключей совпадают', () => {
  const onlyEn = Object.keys(en).filter((key) => !(key in ru))
  const onlyRu = Object.keys(ru).filter((key) => !(key in en))

  assert.deepEqual(onlyEn, [], 'есть в en и нет в ru — русский интерфейс покажет пустоту')
  assert.deepEqual(onlyRu, [], 'есть в ru и нет в en — типы такой ключ не увидят')
})

test('наборы ключей множественного числа совпадают', () => {
  assert.deepEqual(
    Object.keys(enPlurals).filter((key) => !(key in enPlurals && key in ruPlurals)),
    [],
  )
  assert.deepEqual(
    Object.keys(ruPlurals).filter((key) => !(key in enPlurals)),
    [],
  )
})

test('подстановки не разошлись между языками', () => {
  const mismatched: string[] = []

  for (const [key, value] of Object.entries(en)) {
    const other = (ru as Record<string, string>)[key]
    if (other === undefined) {
      continue
    }
    const mine = placeholders(value).join(',')
    const theirs = placeholders(other).join(',')
    if (mine !== theirs) {
      mismatched.push(`${key}: en {${mine}} против ru {${theirs}}`)
    }
  }

  assert.deepEqual(mismatched, [])
})

test('пустых значений нет', () => {
  const empty = [
    ...Object.entries(en).filter(([, value]) => value.trim() === ''),
    ...Object.entries(ru).filter(([, value]) => value.trim() === ''),
  ].map(([key]) => key)

  assert.deepEqual(empty, [])
})

test('русский словарь не повторяет английский дословно', () => {
  const ALLOWED = new Set(['account.galaxyData', 'app.title', 'search.farmMode'])

  const same = Object.entries(en)
    .filter(([key, value]) => {
      const other = (ru as Record<string, string>)[key]
      return other === value && !ALLOWED.has(key) && /\p{L}{4,}/u.test(value)
    })
    .map(([key]) => key)

  assert.deepEqual(same, [], 'строка совпадает дословно — похоже на забытый перевод')
})
