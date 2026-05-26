import { Stack, usePathname } from 'expo-router'
import { View } from 'react-native'
import { ThemeProvider } from '../presentations/components/Theme'
import { LanguageProvider } from '../presentations/components/Language'
import { NotificationProvider } from '../presentations/components/Notification'
import { LibraryProvider } from '../application'
import { PlayerProvider } from '../application/player'
import { AppShellProvider } from '../presentations/components/AppShell'
import { TopBar } from '../presentations/components/TopBar'
import { BottomNav } from '../presentations/components/BottomNav'
import { PlayerBar } from '../presentations/player/PlayerBar'

export default function RootLayout() {
  const pathname = usePathname()
  const isNowPlaying = pathname === '/now-playing'
  const isSearch = pathname === '/search'
  const isSettings = pathname === '/settings'

  const showBottomNav = !isNowPlaying && !isSearch

  // PlayerBar hidden on Now-Playing, Search, and Settings
  const showPlayerBar = !isNowPlaying && !isSearch && !isSettings

  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <LibraryProvider>
            <PlayerProvider>
              <AppShellProvider>
                <View style={{ flex: 1 }}>
                  {/* Persistent top bar (hidden on now-playing) */}
                  <TopBar />

                  {/* Main content */}
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="now-playing"
                      options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                    />
                    <Stack.Screen
                      name="playlist/[id]"
                      options={{ headerTitle: '', headerTransparent: true }}
                    />
                  </Stack>

                  {/* Persistent player bar */}
                  {showPlayerBar && <PlayerBar />}

                  {/* Spotify-like bottom navigation */}
                  {showBottomNav && <BottomNav />}
                </View>
              </AppShellProvider>
            </PlayerProvider>
          </LibraryProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
