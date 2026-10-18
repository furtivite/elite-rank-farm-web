import { LANGUAGE_STORAGE_KEY } from '@/shared/config/storageKeys'
import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from '@/shared/lib/i18n/types'

let snapshot: Language = DEFAULT_LANGUAGE
let initialized = false

const listeners = new Set<() => void>()

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}

export function getLanguageSnapshot(): Language {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true

    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (isLanguage(stored)) {
        snapshot = stored
      }
    } catch {}
  }

  return snapshot
}

export function getServerLanguageSnapshot(): Language {
  return DEFAULT_LANGUAGE
}

export function subscribeToLanguage(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function writeLanguage(language: Language): void {
  getLanguageSnapshot()
  snapshot = language

  try {
    if (language === DEFAULT_LANGUAGE) {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY)
    } else {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    }
  } catch {}

  applyLanguage(language)

  for (const listener of listeners) {
    listener()
  }
}

export function applyLanguage(language: Language): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}
