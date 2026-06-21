import React, { type ComponentProps, useRef } from 'react'
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from './Theme'
import { useLanguage } from './Language'
import { useAppShell } from './AppShell'

type FeatherName = ComponentProps<typeof Feather>['name']

import type { ThemeTokens } from './Theme/tokens'

type IconButtonProps = {
  icon: FeatherName
  onPress: () => void
  label: string
  theme: ThemeTokens
}

const IconButton = ({ icon, onPress, label, theme }: IconButtonProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={10}
    style={({ pressed }) => [
      styles.iconBtn,
      {
        backgroundColor: theme.colors.surfaceSolid,
        borderColor: theme.colors.subtleBorder,
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      },
    ]}
  >
    <Feather name={icon} size={21} color={theme.colors.text} />
  </Pressable>
)

export function TopBar() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { navigationLayout, customTitle, openSidebar, triggerImport } = useAppShell()

  const isSearch = pathname === '/search'
  const isSettings = pathname === '/settings'
  const isPlaylistDetail = pathname.startsWith('/playlist/')
  const isNowPlaying = pathname === '/now-playing'

  if (isNowPlaying) return null

  const showBackButton = isSearch || isPlaylistDetail

  let title = ''
  if (pathname === '/' || pathname === '/library') title = t.library.title
  else if (pathname === '/playlists') title = t.playlists.title
  else if (isSearch) title = t.tabs.search
  else if (isSettings) title = t.settings.title
  else if (isPlaylistDetail && customTitle) title = customTitle
  else if (isPlaylistDetail) title = 'Playlist'

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/library')
    }
  }

  const handleSearch = () => {
    router.push('/search')
  }


  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.subtleBorder,
        },
      ]}
    >
      <View style={[styles.pageInner, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showBackButton ? (
            <IconButton icon="arrow-left" onPress={handleBack} label="Back" theme={theme} />
          ) : (
            <IconButton icon="upload" onPress={triggerImport} label="Import songs" theme={theme} />
          )}
        </View>

        <View style={[styles.titleBlock, { flex: 0, alignItems: 'center' }]}>
          <Text
            numberOfLines={1}
            style={[styles.pageTitle, { color: theme.colors.text }]}
          >
            {title}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {!isSearch && <IconButton icon="search" onPress={handleSearch} label="Search" theme={theme} />}
          {navigationLayout === 'sidebar' && <IconButton icon="menu" onPress={openSidebar} label="Sidebar menu" theme={theme} />}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  homeInner: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageInner: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    gap: 9,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  searchDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
})