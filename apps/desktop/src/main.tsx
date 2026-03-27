import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { NotificationProvider } from './presentations/components/Notification'
import { ThemeProvider } from './presentations/components/Theme'
import { LanguageProvider } from './presentations/components/Language'
import { LibraryProvider } from './presentations/components/Library'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <LibraryProvider>
            <App />
          </LibraryProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
