'use client'

import { use } from 'react'
import { ThemeContext, type ThemeContextValue } from '@/shared/lib/theme/themeContext'

export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext)

  if (value === null) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return value
}
