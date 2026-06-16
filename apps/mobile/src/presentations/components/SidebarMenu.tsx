import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from './Theme'
import { useLanguage } from './Language'
import { useAppShell } from './AppShell'

const SCREEN_WIDTH = Dimensions.get('window').width
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 330)
const ANIMATION_DURATION = 220

type FeatherName = React.ComponentProps<typeof Feather>['name']

type NavLink = {
  label: string
  icon: FeatherName
  route: string
  matchPaths: string[]
}

export function SidebarMenu() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar } = useAppShell()

  const [shouldRender, setShouldRender] = useState(false)

  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current
  const overlayAnim = useRef(new Animated.Value(0)).current

  const appVersion = Constants.expoConfig?.version ?? '1.0.0'
  const appName = 'Melovista'

  const links: NavLink[] = [
    {
      label: t.tabs.search,
      icon: 'search',
      route: '/search',
      matchPaths: ['/search'],
    },
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

  useEffect(() => {
    if (isSidebarOpen) {
      setShouldRender(true)
    }
  }, [isSidebarOpen])

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideAnim } }],
    { useNativeDriver: true }
  )

  const handleGestureStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      if (event.nativeEvent.translationX > SIDEBAR_WIDTH / 3 || event.nativeEvent.velocityX > 500) {
        closeSidebar()
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start()
      }
    }
  }

  useEffect(() => {
    if (!shouldRender) return

    if (isSidebarOpen) {
      slideAnim.setValue(SIDEBAR_WIDTH) // ensure starting pos is hidden if just opened
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isSidebarOpen ? 0 : SIDEBAR_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isSidebarOpen ? 1 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !isSidebarOpen) {
        setShouldRender(false)
      }
    })
  }, [isSidebarOpen, overlayAnim, shouldRender, slideAnim])

  const handleNavigate = (route: string) => {
    closeSidebar()

    setTimeout(() => {
      router.navigate(route as never)
    }, 120)
  }

  const isActiveRoute = (link: NavLink) => {
    if (link.matchPaths.includes(pathname)) return true

    if (pathname.startsWith('/playlist/') && link.route === '/playlists') {
      return true
    }

    return false
  }

  if (!shouldRender) return null

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 2 }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.colors.overlay,
              opacity: overlayAnim
            },
          ]}
        />
      </Pressable>

      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
        activeOffsetX={[0, 20]} // Only activate on horizontal swipe
      >
        <Animated.View
          style={[
            styles.panel,
            {
              width: SIDEBAR_WIDTH,
              backgroundColor: theme.colors.sidebar,
              borderLeftColor: theme.colors.subtleBorder,
              paddingTop: insets.top + 14,
              paddingBottom: insets.bottom + 18,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, SIDEBAR_WIDTH],
                    outputRange: [0, SIDEBAR_WIDTH],
                    extrapolate: 'clamp', // prevent sliding to the left past 0
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../../../../packages/brand/logos/icon_only_gradient.png')}
                style={styles.logo}
                contentFit="contain"
              />

              <View style={styles.brandTextBlock}>
                <Text style={[styles.appName, { color: theme.colors.text }]}>
                  {appName}
                </Text>

                <Text style={[styles.version, { color: theme.colors.mutedText }]}>
                  Mobile music player
                </Text>
              </View>
            </View>

            <Pressable
              onPress={closeSidebar}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: theme.colors.surfaceSolid,
                  borderColor: theme.colors.subtleBorder,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Feather name="chevron-right" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.colors.surfaceSolid,
                borderColor: theme.colors.subtleBorder,
              },
            ]}
          >
            <View style={styles.heroIconWrap}>
              <Feather name="headphones" size={20} color={theme.colors.primary} />
            </View>

            <View style={styles.heroTextBlock}>
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                Your sound space
              </Text>

              <Text style={[styles.heroSubtitle, { color: theme.colors.mutedText }]}>
                Listen, organize, and enjoy offline.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.subtleBorder }]} />

          <View style={styles.links}>
            {links.map((link) => {
              const isActive = isActiveRoute(link)

              return (
                <Pressable
                  key={link.route}
                  onPress={() => handleNavigate(link.route)}
                  accessibilityRole="button"
                  accessibilityLabel={link.label}
                  style={({ pressed }) => [
                    styles.linkRow,
                    {
                      backgroundColor: isActive
                        ? theme.colors.primary + '18'
                        : pressed
                          ? theme.colors.surfaceHover
                          : 'transparent',
                      borderColor: isActive
                        ? theme.colors.primary + '30'
                        : 'transparent',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.linkIconBox,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary + '20'
                          : theme.colors.surfaceSolid,
                      },
                    ]}
                  >
                    <Feather
                      name={link.icon}
                      size={19}
                      color={isActive ? theme.colors.primary : theme.colors.mutedText}
                    />
                  </View>

                  <Text
                    style={[
                      styles.linkLabel,
                      {
                        color: isActive ? theme.colors.primary : theme.colors.text,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {link.label}
                  </Text>

                  {isActive ? (
                    <View
                      style={[
                        styles.activeDot,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  ) : null}
                </Pressable>
              )
            })}
          </View>

          <View style={styles.footerSpacer} />

          { /* Footer card */}
          <View
            style={[
              styles.footerCard,
              {
                backgroundColor: theme.colors.surfaceDim,
                borderColor: theme.colors.subtleBorder,
              },
            ]}
          >
            <View>
              <Text style={[styles.footerTitle, { color: theme.colors.text }]}>
                Melovista Mobile
              </Text>

              <Text style={[styles.footerVersion, { color: theme.colors.mutedText }]}>
                Version {appVersion}
              </Text>
            </View>

            <Feather name="music" size={18} color={theme.colors.primary} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    elevation: 18,
    zIndex: 2
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
  },
  brandTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  appName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  version: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroCard: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },
  links: {
    gap: 8,
  },
  linkRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  linkIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  linkLabel: {
    flex: 1,
    fontSize: 15,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  footerSpacer: {
    flex: 1,
  },
  footerCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  footerVersion: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
  },
})