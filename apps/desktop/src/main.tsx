import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { NotificationProvider } from './presentations/components/Notification'
import { ThemeProvider } from './presentations/components/Theme'
import { LanguageProvider } from './presentations/components/Language'
import { LibraryProvider, useLibraryContext } from './presentations/components/Library'
import { PlayerProvider, UIProvider } from '@music/hooks'
import { ElectronStorageAdapter } from './infrastructure/services/ElectronStorageAdapter'
import { useNotification } from './application/hooks'
import { useLanguage } from './presentations/components/Language'

const storage = new ElectronStorageAdapter();

const PlayerWithLibrary = ({ children }: { children: React.ReactNode }) => {
  const { songs } = useLibraryContext();
  const { showNotification } = useNotification();
  const { t } = useLanguage();

  return (
    <PlayerProvider 
      storage={storage} 
      allSongs={songs}
      onFileError={(song) => {
        showNotification('error', t('player.fileNotFound').replace('{title}', song.title));
      }}
    >
      {children}
    </PlayerProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <UIProvider>
    <LanguageProvider>
      <ThemeProvider storage={storage}>
        <NotificationProvider>
          <LibraryProvider>
            <PlayerWithLibrary>
              <App />
            </PlayerWithLibrary>
          </LibraryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  </UIProvider>,
)
