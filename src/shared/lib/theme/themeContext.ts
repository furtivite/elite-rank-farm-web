import { createContext } from 'react'
import type { ThemePreference } from '@/shared/lib/theme/types'

export type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
