import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

import { darkTheme, lightTheme, type ThemeName, type ThemeTokens } from './tokens'
import { loadThemePreference, saveThemePreference } from './storage'

type ThemeContextValue = {
  theme: ThemeTokens
  themeName: ThemeName
  setThemeName: (next: ThemeName) => void
  toggleTheme: () => void
  isHydrated: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const systemThemeName: ThemeName = systemScheme === 'dark' ? 'dark' : 'light'

  const [themeName, setThemeNameState] = useState<ThemeName>(systemThemeName)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const saved = await loadThemePreference()
        if (!cancelled && saved) setThemeNameState(saved)
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // If the user never picked a theme, follow system changes before hydration finishes.
  useEffect(() => {
    if (!isHydrated) {
      setThemeNameState(systemThemeName)
    }
  }, [isHydrated, systemThemeName])

  const setThemeName = useCallback((next: ThemeName) => {
    setThemeNameState(next)
    void saveThemePreference(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeName(themeName === 'dark' ? 'light' : 'dark')
  }, [setThemeName, themeName])

  const theme = themeName === 'dark' ? darkTheme : lightTheme

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeName, setThemeName, toggleTheme, isHydrated }),
    [theme, themeName, setThemeName, toggleTheme, isHydrated],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
