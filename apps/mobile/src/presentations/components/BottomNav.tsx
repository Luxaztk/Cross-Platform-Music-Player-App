import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from './Theme'
import { useLanguage } from './Language'

type FeatherName = React.ComponentProps<typeof Feather>['name']

type BottomNavItem = {
  label: string
  icon: FeatherName
  route: Href
  matchPaths: string[]
}

export const BOTTOM_NAV_HEIGHT = 120;

export function BottomNav() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()

  const items: BottomNavItem[] = [
    {
      label: t.tabs.library,
      icon: 'home',
      route: '/library',
      matchPaths: ['/', '/library'],
    },
    {
      label: t.tabs.playlists,
      icon: 'list',
      route: '/playlists',
      matchPaths: ['/playlists'],
    },
    {
      label: t.settings.title,
      icon: 'settings',
      route: '/settings',
      matchPaths: ['/settings'],
    },
  ]

  const isActive = (item: BottomNavItem) => {
    if (item.matchPaths.includes(pathname)) return true

    if (pathname.startsWith('/playlist/') && item.route === '/playlists') {
      return true
    }

    return false
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.subtleBorder,
          height: BOTTOM_NAV_HEIGHT
        },
      ]}
    >
      <View style={styles.inner}>
        {items.map((item) => {
          const active = isActive(item)

          return (
            <Pressable
              key={String(item.route)}
              onPress={() => router.navigate(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                {
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: active
                      ? theme.colors.primary + '20'
                      : 'transparent',
                    borderRadius: active ? 18 : 0,
                  },
                ]}
              >
                <Feather
                  name={item.icon}
                  size={22}
                  color={active ? theme.colors.primary : theme.colors.mutedText}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: active ? theme.colors.primary : theme.colors.mutedText,
                    fontWeight: active ? '800' : '600',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 7,
    paddingHorizontal: 10,
  },
  inner: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  item: {
    flex: 1,
    maxWidth: 110,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    minWidth: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
})