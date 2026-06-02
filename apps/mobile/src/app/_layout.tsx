import { Stack, usePathname } from 'expo-router'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ThemeProvider } from '../presentations/components/Theme'
import { LanguageProvider } from '../presentations/components/Language'
import { NotificationProvider } from '../presentations/components/Notification'
import { LibraryProvider } from '../application'
import { PlayerProvider } from '../application/player'
import { AppShellProvider, useAppShell } from '../presentations/components/AppShell'
import { TopBar } from '../presentations/components/TopBar'
import { BottomNav } from '../presentations/components/BottomNav'
import { PlayerBar } from '../presentations/player/PlayerBar'
import { SidebarMenu } from '../presentations/components/SidebarMenu'

function AppLayout() {
  const pathname = usePathname()
  const { navigationLayout } = useAppShell()
  const isNowPlaying = pathname === '/now-playing'
  const isSearch = pathname === '/search'
  const isSettings = pathname === '/settings'

  const showBottomNav = !isNowPlaying && !isSearch && navigationLayout === 'tabs'

  // PlayerBar hidden on Now-Playing, Search, and Settings
  const showPlayerBar = !isNowPlaying && !isSearch && !isSettings

  return (
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

      {/* Spotify-like bottom navigation */}
      {showBottomNav && <BottomNav />}

      {/* Sidebar navigation overlay */}
      <SidebarMenu />

      {/* Persistent player bar */}
      {showPlayerBar && <PlayerBar />}
    </View>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <LibraryProvider>
              <PlayerProvider>
                <AppShellProvider>
                  <AppLayout />
                </AppShellProvider>
              </PlayerProvider>
            </LibraryProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
