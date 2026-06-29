import React, { type ComponentProps, useRef, useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as DocumentPicker from 'expo-document-picker'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from './Theme'
import { useLanguage } from './Language'
import { useAppShell } from './AppShell'
import { useLibraryContext } from '@music/hooks'
import { useNotifications } from '../../presentations/components/Notification'

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
  const { navigationLayout, customTitle, openSidebar, triggerImport, registerImportHandler } = useAppShell()
  
  const { notify } = useNotifications()
  const { handleImportFiles } = useLibraryContext()

  const pickAudioFiles = useCallback(async () => {
    try {
      if (handleImportFiles) {
        await handleImportFiles();
        notify({ message: 'Đã nhập bài hát', kind: 'success' })
      }
    } catch {
      notify({ message: t.library.importFailed, kind: 'error' })
    }
  }, [handleImportFiles, notify, t])

  useEffect(() => {
    registerImportHandler(pickAudioFiles)
    return () => registerImportHandler(null)
  }, [registerImportHandler, pickAudioFiles])

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
      router.replace('/playlists')
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

        <View style={[styles.titleBlock, { position: "absolute", width: "100%", flex: 0, alignItems: 'center' }]}>
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