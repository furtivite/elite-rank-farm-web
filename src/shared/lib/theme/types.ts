export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}
