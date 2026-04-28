import { Stack, usePathname } from 'expo-router'
import { View } from 'react-native'
import { ThemeProvider } from '../presentations/components/Theme'
import { LanguageProvider } from '../presentations/components/Language'
import { NotificationProvider } from '../presentations/components/Notification'
import { LibraryProvider } from '../application'
import { PlayerProvider } from '../application/player'
import { AppShellProvider } from '../presentations/components/AppShell'
import { TopBar } from '../presentations/components/TopBar'
import { SidebarMenu } from '../presentations/components/SidebarMenu'
import { PlayerBar } from '../presentations/player/PlayerBar'

export default function RootLayout() {
  const pathname = usePathname()
  const isNowPlaying = pathname === '/now-playing'
  const isSettings = pathname === '/settings'

  // PlayerBar hidden on Now-Playing (has its own controls) and Settings
  const showPlayerBar = !isNowPlaying && !isSettings

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

                  {/* Sidebar overlay (renders on top of everything) */}
                  <SidebarMenu />
                </View>
              </AppShellProvider>
            </PlayerProvider>
          </LibraryProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
