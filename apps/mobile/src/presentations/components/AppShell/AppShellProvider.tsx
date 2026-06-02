import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type NavigationLayout = 'tabs' | 'sidebar'
const LAYOUT_KEY = 'melovista:layout'

type AppShellContextValue = {
  /** Sidebar open/close */
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void

  /** Navigation Layout */
  navigationLayout: NavigationLayout
  setNavigationLayout: (layout: NavigationLayout) => void

  /** Dynamic top‑bar title (e.g. playlist name).  `null` = use default. */
  customTitle: string | null
  setCustomTitle: (title: string | null) => void

  /**
   * Register the "import songs" handler from the library screen.
   * TopBar calls `triggerImport()` when the import button is pressed.
   */
  registerImportHandler: (handler: (() => void) | null) => void
  triggerImport: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [navigationLayout, setNavigationLayoutState] = useState<NavigationLayout>('tabs')
  const [customTitle, setCustomTitle] = useState<string | null>(null)
  const importHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const saved = await AsyncStorage.getItem(LAYOUT_KEY)
          if (!cancelled && (saved === 'tabs' || saved === 'sidebar')) {
            setNavigationLayoutState(saved as NavigationLayout)
          }
        } catch (e) {
          // ignore
        }
      })()
    return () => {
      cancelled = true
    }
  }, [])

  const setNavigationLayout = useCallback((layout: NavigationLayout) => {
    setNavigationLayoutState(layout)
    void AsyncStorage.setItem(LAYOUT_KEY, layout).catch(() => { })
  }, [])

  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])

  const registerImportHandler = useCallback((handler: (() => void) | null) => {
    importHandlerRef.current = handler
  }, [])

  const triggerImport = useCallback(() => {
    importHandlerRef.current?.()
  }, [])

  const value = useMemo<AppShellContextValue>(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      navigationLayout,
      setNavigationLayout,
      customTitle,
      setCustomTitle,
      registerImportHandler,
      triggerImport,
    }),
    [
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      navigationLayout,
      setNavigationLayout,
      customTitle,
      setCustomTitle,
      registerImportHandler,
      triggerImport,
    ],
  )

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

export function useAppShell() {
  const ctx = useContext(AppShellContext)
  if (!ctx) throw new Error('useAppShell must be used within AppShellProvider')
  return ctx
}
