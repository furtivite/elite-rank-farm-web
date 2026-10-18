export type Language = 'en' | 'ru'

export const LANGUAGES: readonly Language[] = ['ru', 'en']

export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGE_LABEL: Record<Language, string> = {
  ru: 'RU',
  en: 'US',
}

export const LOCALE: Record<Language, string> = {
  ru: 'ru-RU',
  en: 'en-US',
}
