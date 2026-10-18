import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  federalRankName,
  imperialRankName,
  RANK_COUNT,
} from '@/entities/commander-state/model/ranks'
import { createTranslate } from '@/shared/lib/i18n'
import { en } from '@/shared/lib/i18n/dictionary/en'
import { ru as ruDictionary } from '@/shared/lib/i18n/dictionary/ru'

const ru = createTranslate('ru')
const enT = createTranslate('en')

test('в обеих таблицах по 15 значений, и на обоих языках', () => {
  for (const dictionary of [en, ruDictionary]) {
    for (const side of ['imperial', 'federal'] as const) {
      const keys = Object.keys(dictionary).filter((key) => key.startsWith(`rank.${side}.`))
      assert.equal(keys.length, RANK_COUNT, `${side}: ожидалось ${RANK_COUNT} званий`)
    }
  }
})

test('индекс из Journal соответствует тому, что показывает игра', () => {
  assert.equal(imperialRankName(0, ru), 'Нет звания')
  assert.equal(imperialRankName(1, ru), 'Чужак')
  assert.equal(imperialRankName(9, ru), 'Граф')
  assert.equal(imperialRankName(10, ru), 'Эрл')
  assert.equal(imperialRankName(14, ru), 'Король')

  assert.equal(federalRankName(0, ru), 'Нет звания')
  assert.equal(federalRankName(1, ru), 'Рекрут')
  assert.equal(federalRankName(2, ru), 'Кадет')
  assert.equal(federalRankName(14, ru), 'Адмирал')
})

test('английский берёт слова из игры, а не переводит русские (92)', () => {
  assert.equal(imperialRankName(2, enT), 'Serf')
  assert.equal(imperialRankName(4, enT), 'Squire')
  assert.equal(imperialRankName(9, enT), 'Count')
  assert.equal(imperialRankName(10, enT), 'Earl')

  assert.equal(federalRankName(3, enT), 'Midshipman')
  assert.equal(federalRankName(9, enT), 'Lt. Commander')
  assert.equal(federalRankName(14, enT), 'Admiral')
})

test('индекс вне таблицы не теряется', () => {
  assert.equal(imperialRankName(15, ru), 'Ранг 15')
  assert.equal(federalRankName(99, ru), 'Ранг 99')
  assert.equal(imperialRankName(15, enT), 'Rank 15')
})
