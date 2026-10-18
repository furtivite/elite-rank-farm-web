'use client'

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { applyTheme } from '@/shared/lib/theme/applyTheme'
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
  writeTheme,
} from '@/shared/lib/theme/store'
import { ThemeContext } from '@/shared/lib/theme/themeContext'
import type { ThemePreference } from '@/shared/lib/theme/types'

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  )

  useEffect(() => {
    applyTheme(preference)

    if (preference !== 'system') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      applyTheme('system')
    }

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    writeTheme(next)
  }, [])

  return <ThemeContext value={{ preference, setPreference }}>{children}</ThemeContext>
}
