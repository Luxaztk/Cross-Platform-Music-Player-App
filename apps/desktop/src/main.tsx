import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { NotificationProvider } from './presentations/components/Notification'
import { ThemeProvider } from './presentations/components/Theme'
import { LanguageProvider } from './presentations/components/Language'
import { LibraryProvider } from './presentations/components/Library'
import { PlayerProvider } from '@music/hooks'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <LibraryProvider>
            <PlayerProvider>
              <App />
            </PlayerProvider>
          </LibraryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
