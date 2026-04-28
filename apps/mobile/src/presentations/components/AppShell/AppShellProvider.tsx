import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type AppShellContextValue = {
  /** Sidebar open/close */
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void

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
  const [customTitle, setCustomTitle] = useState<string | null>(null)
  const importHandlerRef = useRef<(() => void) | null>(null)

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
      customTitle,
      setCustomTitle,
      registerImportHandler,
      triggerImport,
    }),
    [
      isSidebarOpen,
      openSidebar,
      closeSidebar,
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
