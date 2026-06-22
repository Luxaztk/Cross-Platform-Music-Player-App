import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {
  NotificationProvider,
  ThemeProvider,
  LanguageProvider,
  LibraryProvider,
  UpdateNotification,
  ErrorBoundary,
} from '@components'
import { UIProvider } from '@music/hooks'
import { ElectronStorageAdapter } from './infrastructure/services/ElectronStorageAdapter'
import { SettingsProvider, DownloadProvider } from './application/providers'
import { HotkeysProvider } from './application/context/HotkeysProvider'
import { PlayerWithLibrary } from './application/providers/PlayerWithLibrary'

const storage = new ElectronStorageAdapter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary componentName="MeloVista App">
      <UIProvider>
        <LanguageProvider>
          <ThemeProvider storage={storage}>
            <NotificationProvider>
              <SettingsProvider>
                <LibraryProvider>
                  <DownloadProvider>
                    <HotkeysProvider>
                      <PlayerWithLibrary>
                        <App />
                      </PlayerWithLibrary>
                    </HotkeysProvider>
                  </DownloadProvider>
                </LibraryProvider>
              </SettingsProvider>
            </NotificationProvider>
            {/* KHU VỰC GLOBAL OVERLAY (NỔI TRÊN CÙNG) */}
            <UpdateNotification />
          </ThemeProvider>
        </LanguageProvider>
      </UIProvider>
    </ErrorBoundary>
  </StrictMode>,
)
