import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from './Theme'
import { useLanguage } from './Language'
import { useAppShell } from './AppShell'

/**
 * Persistent top bar rendered above the Stack navigator.
 *
 * Adapts its buttons and title based on the current pathname:
 *  - Home (library/playlists): Import | Title | Search + Menu
 *  - Search / Settings:        Back   | Title | Menu
 *  - Playlist detail:          Back   | Playlist name | Menu
 *  - Now-playing:              not rendered (has its own header)
 */
export function TopBar() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { openSidebar, triggerImport, customTitle } = useAppShell()

  // ── Derive config from pathname ────────────────────────────────

  const isHome =
    pathname === '/' ||
    pathname === '/library' ||
    pathname === '/playlists'

  const isSearch = pathname === '/search'
  const isSettings = pathname === '/settings'
  const isPlaylistDetail = pathname.startsWith('/playlist/')
  const isNowPlaying = pathname === '/now-playing'

  // Don't render on Now-Playing (it has its own custom header)
  if (isNowPlaying) return null

  // Left action
  const showImportButton = isHome
  const showBackButton = isSearch || isSettings || isPlaylistDetail

  // Right actions
  const showSearchButton = isHome
  const showMenuButton = true

  // Title
  let title = ''
  if (pathname === '/' || pathname === '/library') title = t.library.title
  else if (pathname === '/playlists') title = t.playlists.title
  else if (isSearch) title = t.tabs.search
  else if (isSettings) title = t.settings.title
  else if (isPlaylistDetail && customTitle) title = customTitle
  else if (isPlaylistDetail) title = ''

  // ── Handlers ───────────────────────────────────────────────────

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  const handleSearch = () => {
    router.push('/search')
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* ── Left slot ── */}
        <View style={styles.slot}>
          {showBackButton && (
            <Pressable onPress={handleBack} hitSlop={12} style={styles.iconBtn}>
              <Feather name="arrow-left" size={22} color={theme.colors.text} />
            </Pressable>
          )}
          {showImportButton && (
            <Pressable onPress={triggerImport} hitSlop={12} style={styles.iconBtn}>
              <Feather name="plus" size={22} color={theme.colors.text} />
            </Pressable>
          )}
        </View>

        {/* ── Center ── */}
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* ── Right slot ── */}
        <View style={[styles.slot, styles.slotRight]}>
          {showSearchButton && (
            <Pressable onPress={handleSearch} hitSlop={12} style={styles.iconBtn}>
              <Feather name="search" size={20} color={theme.colors.text} />
            </Pressable>
          )}
          {showMenuButton && (
            <Pressable onPress={openSidebar} hitSlop={12} style={styles.iconBtn}>
              <Feather name="menu" size={22} color={theme.colors.text} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slot: {
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotRight: {
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
})
