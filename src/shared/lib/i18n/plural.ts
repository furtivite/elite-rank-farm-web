import type { Language } from '@/shared/lib/i18n/types'

export type PluralForms = {
  one: string
  few?: string
  many: string
}

export function pluralize(language: Language, count: number, forms: PluralForms): string {
  if (language === 'en') {
    return count === 1 ? forms.one : forms.many
  }

  if (!Number.isInteger(count)) {
    return forms.few ?? forms.many
  }

  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return forms.one
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms.few ?? forms.many
  }

  return forms.many
}
