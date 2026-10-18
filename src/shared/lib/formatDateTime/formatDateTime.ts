import { LOCALE, type Language } from '@/shared/lib/i18n'

const formatters = new Map<Language, Intl.DateTimeFormat>()

function formatter(language: Language): Intl.DateTimeFormat {
  let cached = formatters.get(language)
  if (cached === undefined) {
    cached = new Intl.DateTimeFormat(LOCALE[language], {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    formatters.set(language, cached)
  }

  return cached
}

export function formatDateTime(timestamp: number, language: Language): string {
  return formatter(language).format(new Date(timestamp))
}
