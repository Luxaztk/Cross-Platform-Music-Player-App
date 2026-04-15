import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import {
  NotificationProvider,
  ThemeProvider,
  LanguageProvider,
  LibraryProvider,
  UpdateNotification,
} from '@components'
import { PlayerProvider, UIProvider, useLibraryContext } from '@music/hooks'
import { ElectronStorageAdapter } from './infrastructure/services/ElectronStorageAdapter'
import { useNotification, useLanguage } from '@hooks'
import { SettingsProvider } from './application/hooks/useSettings'
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
  <UIProvider>
    <LanguageProvider>
      <ThemeProvider storage={storage}>
        <NotificationProvider>
          <SettingsProvider>
            <LibraryProvider>
              <PlayerWithLibrary>
                <App />
              </PlayerWithLibrary>
            </LibraryProvider>
          </SettingsProvider>
        </NotificationProvider>
        {/* KHU VỰC GLOBAL OVERLAY (NỔI TRÊN CÙNG) */}
        <UpdateNotification />
      </ThemeProvider>
    </LanguageProvider>
  </UIProvider>,
)
