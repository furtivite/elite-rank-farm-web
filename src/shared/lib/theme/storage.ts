import { THEME_STORAGE_KEY } from '@/shared/config/storageKeys'
import { isThemePreference, type ThemePreference } from '@/shared/lib/theme/types'

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) {
      return stored
    }
  } catch {
    return 'system'
  }

  return 'system'
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    return
  }
}
