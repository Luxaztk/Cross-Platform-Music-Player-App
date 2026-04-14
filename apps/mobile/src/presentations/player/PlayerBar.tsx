import { router, usePathname } from 'expo-router'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../theme'
import { usePlayerState, usePlayerProgress } from '../../application/player'
import { formatTime } from './format'

export function PlayerBar() {
  const { theme } = useTheme()
  const { currentSong, togglePlayPause, playNext, playPrevious } = usePlayerState()
  const progress = usePlayerProgress()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  const isInTabs = pathname.includes('(tabs)') || pathname === '/' || pathname === '/library' || pathname === '/search' || pathname === '/playlists' || pathname === '/settings'
  const marginBottom = isInTabs ? 90 : insets.bottom + 12

  const positionMs = progress.positionMs

  const title = currentSong?.title ?? 'Nothing playing'
  const subtitle = currentSong ? currentSong.artist : 'Tap a song to start'

  const canShow = !!currentSong

  const timeLabel = useMemo(() => {
    return `${formatTime(positionMs)} / ${formatTime(progress.durationMs)}`
  }, [positionMs, progress.durationMs])

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
      <View style={styles.text}>
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
            void playPrevious()
          }}
          hitSlop={10}
        >
          <Text style={[styles.controlText, { color: theme.colors.text }]}>⏮</Text>
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            void togglePlayPause()
          }}
          hitSlop={10}
        >
          <Text style={[styles.controlText, { color: theme.colors.text }]}>
            {progress.isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            void playNext()
          }}
          hitSlop={10}
        >
          <Text style={[styles.controlText, { color: theme.colors.text }]}>⏭</Text>
        </Pressable>
      </View>

      <Text style={[styles.time, { color: theme.colors.mutedText }]}>{timeLabel}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  text: {
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
  },
  controlText: {
    fontSize: 18,
    fontWeight: '700',
  },
  time: {
    fontSize: 11,
    textAlign: 'right',
  },
})
