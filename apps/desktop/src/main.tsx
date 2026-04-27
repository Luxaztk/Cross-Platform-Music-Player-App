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
import { PlayerProvider, UIProvider, useLibraryContext } from '@music/hooks'
import { ElectronStorageAdapter } from './infrastructure/services/ElectronStorageAdapter'
import { useNotification, useLanguage } from '@hooks'
import { SettingsProvider, DownloadProvider } from './application/providers'

const storage = new ElectronStorageAdapter()

const PlayerWithLibrary = ({ children }: { children: React.ReactNode }) => {
  const { songs } = useLibraryContext()
  const { showNotification } = useNotification()
  const { t } = useLanguage()

  return (
    <PlayerProvider
      storage={storage}
      allSongs={songs}
      onFileError={(song) => {
        showNotification('error', t('player.fileNotFound').replace('{title}', song.title))
      }}
    >
      {children}
    </PlayerProvider>
  )
}

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
                    <PlayerWithLibrary>
                      <App />
                    </PlayerWithLibrary>
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
