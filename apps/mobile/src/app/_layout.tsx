import { Stack, usePathname } from 'expo-router'
import { View } from 'react-native'
import { ThemeProvider } from '../theme'
import { LanguageProvider } from '../i18n'
import { NotificationProvider } from '../notifications'
import { LibraryProvider } from '../application'
import { PlayerProvider } from '../application/player'
import { PlayerBar } from '../presentations/player/PlayerBar'

export default function RootLayout() {
  const pathname = usePathname()
  const isNowPlaying = pathname === '/now-playing'

  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <LibraryProvider>
            <PlayerProvider>
              <View style={{ flex: 1 }}>
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
                {!isNowPlaying && <PlayerBar />}
              </View>
            </PlayerProvider>
          </LibraryProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
