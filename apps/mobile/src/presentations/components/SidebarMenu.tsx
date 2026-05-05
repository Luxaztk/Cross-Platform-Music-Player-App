import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from './Theme'
import { useLanguage } from './Language'
import { useAppShell } from './AppShell'

const SCREEN_WIDTH = Dimensions.get('window').width
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75
const ANIMATION_DURATION = 250

export function SidebarMenu() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar } = useAppShell()

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current
  const overlayAnim = useRef(new Animated.Value(0)).current

  const appVersion = Constants.expoConfig?.version ?? '1.0.0'
  const appName = 'Melovista'

  useEffect(() => {
    if (isSidebarOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SIDEBAR_WIDTH,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isSidebarOpen, slideAnim, overlayAnim])

  type NavLink = {
    label: string
    icon: React.ComponentProps<typeof Feather>['name']
    route: string
    matchPaths: string[]
  }

  const links: NavLink[] = [
    {
      label: t.tabs.library,
      icon: 'home',
      route: '/library',
      matchPaths: ['/', '/library'],
    },
    {
      label: t.tabs.search,
      icon: 'search',
      route: '/search',
      matchPaths: ['/search'],
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

  const handleNavigate = (route: string) => {
    closeSidebar()
    setTimeout(() => {
      router.navigate(route as any)
    }, 100)
  }

  if (!isSidebarOpen) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim },
          ]}
        />
      </Pressable>

      <Animated.View
        style={[
          styles.panel,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: theme.colors.surface,
            borderLeftColor: theme.colors.border,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.branding}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.logoText, { color: theme.colors.primary }]}>M</Text>
          </View>
          <Text style={[styles.appName, { color: theme.colors.text }]}>{appName}</Text>
          <Text style={[styles.version, { color: theme.colors.mutedText }]}>v{appVersion}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.links}>
          {links.map((link) => {
            const isActive = link.matchPaths.includes(pathname)
            return (
              <Pressable
                key={link.route}
                onPress={() => handleNavigate(link.route)}
                style={[
                  styles.linkRow,
                  isActive && {
                    backgroundColor: theme.colors.primary + '14',
                  },
                ]}
              >
                <Feather
                  name={link.icon}
                  size={20}
                  color={isActive ? theme.colors.primary : theme.colors.mutedText}
                />
                <Text
                  style={[
                    styles.linkLabel,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.text,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {link.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: 1,
    paddingHorizontal: 20,
  },
  branding: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  version: {
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  links: {
    gap: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  linkLabel: {
    fontSize: 16,
  },
})