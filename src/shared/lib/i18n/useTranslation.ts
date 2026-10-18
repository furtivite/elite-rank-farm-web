'use client'

import { useSyncExternalStore } from 'react'
import { en, enPlurals } from '@/shared/lib/i18n/dictionary/en'
import { ru, ruPlurals } from '@/shared/lib/i18n/dictionary/ru'
import { pluralize } from '@/shared/lib/i18n/plural'
import {
  getLanguageSnapshot,
  getServerLanguageSnapshot,
  subscribeToLanguage,
} from '@/shared/lib/i18n/store'
import type { Language } from '@/shared/lib/i18n/types'

export type TranslationKey = keyof typeof en
export type PluralKey = keyof typeof enPlurals

const DICTIONARIES = { en, ru } as const
const PLURALS = { en: enPlurals, ru: ruPlurals } as const

export type Translate = {
  (key: TranslationKey, params?: Record<string, string | number>): string
  plural: (key: PluralKey, count: number) => string
  pluralWord: (key: PluralKey, count: number) => string
  language: Language
}

export function useTranslation(): Translate {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  )

  return createTranslate(language)
}

export function currentTranslate(): Translate {
  return createTranslate(getLanguageSnapshot())
}

export function createTranslate(language: Language): Translate {
  const dictionary = DICTIONARIES[language]
  const plurals = PLURALS[language]

  const translate = ((key: TranslationKey, params?: Record<string, string | number>) => {
    const template = dictionary[key]

    if (params === undefined) {
      return template
    }

    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template as string,
    )
  }) as Translate

  translate.pluralWord = (key, count) => pluralize(language, count, plurals[key])
  translate.plural = (key, count) => `${count} ${translate.pluralWord(key, count)}`
  translate.language = language

  return translate
}
