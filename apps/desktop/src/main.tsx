import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { NotificationProvider } from './presentations/components/Notification'
import { ThemeProvider } from './presentations/components/Theme'
import { LanguageProvider } from './presentations/components/Language'
import { LibraryProvider, useLibraryContext } from './presentations/components/Library'
import { PlayerProvider } from '@music/hooks'
import { ElectronStorageAdapter } from './infrastructure/services/ElectronStorageAdapter'

const storage = new ElectronStorageAdapter();

const PlayerWithLibrary = ({ children }: { children: React.ReactNode }) => {
  const { songs } = useLibraryContext();
  return (
    <PlayerProvider storage={storage} allSongs={songs}>
      {children}
    </PlayerProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <LibraryProvider>
            <PlayerWithLibrary>
              <App />
            </PlayerWithLibrary>
          </LibraryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
