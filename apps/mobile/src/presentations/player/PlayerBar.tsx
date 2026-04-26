import { router, usePathname } from 'expo-router'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../presentations/components/Theme'
import { usePlayerState, usePlayerProgress } from '../../application/player'
import { formatTime } from './format'

export function PlayerBar() {
  const { theme } = useTheme()
  const { currentSong, togglePlayPause, next, prev } = usePlayerState()
  const progress = usePlayerProgress()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  const isInTabs =
    pathname.includes('(tabs)') ||
    pathname === '/' ||
    pathname === '/library' ||
    pathname === '/search' ||
    pathname === '/playlists' ||
    pathname === '/settings'

  const marginBottom = isInTabs ? 90 : insets.bottom + 12

  const title = currentSong?.title ?? 'Nothing playing'
  const subtitle = currentSong ? currentSong.artist : 'Tap a song to start'

  const canShow = !!currentSong

  const timeLabel = useMemo(() => {
    return `${formatTime(progress.positionMs)} / ${formatTime(progress.durationMs)}`
  }, [progress.positionMs, progress.durationMs])

  const progressPercent =
    progress.durationMs > 0
      ? Math.min((progress.positionMs / progress.durationMs) * 100, 100)
      : 0

  if (!canShow) return null

  return (
    <Pressable
      onPress={() => router.push('/now-playing')}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          bottom: marginBottom,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.cover, { backgroundColor: theme.colors.primary + '18' }]}>
          <Text style={[styles.coverText, { color: theme.colors.primary }]}>M</Text>
        </View>

        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              void prev()
            }}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Text style={[styles.controlText, { color: theme.colors.text }]}>⏮</Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              void togglePlayPause()
            }}
            hitSlop={10}
            style={[styles.playBtn, { backgroundColor: theme.colors.text }]}
          >
            <Text style={[styles.playBtnText, { color: theme.colors.background }]}>
              {progress.isPlaying ? '⏸' : '▶'}
            </Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              void next()
            }}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Text style={[styles.controlText, { color: theme.colors.text }]}>⏭</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${progressPercent}%` as any,
              },
            ]}
          />
        </View>

        <Text style={[styles.time, { color: theme.colors.mutedText }]}>{timeLabel}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 20,
    fontWeight: '800',
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: 18,
    fontWeight: '700',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  bottomRow: {
    gap: 8,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
  },
  time: {
    fontSize: 11,
    textAlign: 'right',
  },
})