import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { loadLanguagePreference, saveLanguagePreference } from './storage'
import { translations, type LanguageCode, type Translations } from './translations'

type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (next: LanguageCode) => void
  t: Translations
  isHydrated: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const saved = await loadLanguagePreference()
        if (!cancelled && saved) setLanguageState(saved)
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next)
    void saveLanguagePreference(next)
  }, [])

  const t = translations[language]

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, isHydrated }),
    [language, setLanguage, t, isHydrated],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
