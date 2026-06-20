import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'

import { useTheme } from '../../presentations/components/Theme'
import { useAppShell } from '../../presentations/components/AppShell'
import { usePlayerState, usePlayerProgress } from '../../application/player'

import { BOTTOM_NAV_HEIGHT } from '../components/BottomNav'

/**
 * Persistent mini-player bar shown at the bottom of most screens.
 *
 * Layout (per spec):
 *   ┌─ progress bar (thin, non-seekable) ──────────────────┐
 *   │  [cover]  Title / Artist       [▶/❚❚]  [⏭]          │
 *   └──────────────────────────────────────────────────────┘
 *
 * When no song is loaded, shows a blank cover + "No song is being played".
 * Tapping the bar navigates to the Now Playing screen.
 */
export function PlayerBar() {
  const { theme } = useTheme()
  const { currentSong, togglePlayPause, next } = usePlayerState()
  const progress = usePlayerProgress()
  const insets = useSafeAreaInsets()
  const { navigationLayout } = useAppShell()

  // Position: sit above the custom bottom navigation if tabs are used
  const bottomOffset = navigationLayout === 'tabs' ? BOTTOM_NAV_HEIGHT + 8 : insets.bottom + 16

  const hasSong = !!currentSong
  const title = currentSong?.title ?? ''
  const artist = currentSong?.artist ?? ''

  const progressPercent = useMemo(() => {
    if (!hasSong || progress.durationMs <= 0) return 0
    return Math.min((progress.positionMs / progress.durationMs) * 100, 100)
  }, [hasSong, progress.positionMs, progress.durationMs])

  return (
    <Pressable
      onPress={() => hasSong && router.push('/now-playing')}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.playerBar,
          borderColor: theme.colors.subtleBorder,
          bottom: bottomOffset,
        },
      ]}
    >
      {/* ── Progress bar (top edge, non-seekable) ── */}
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${progressPercent}%` as import('react-native').DimensionValue,
            },
          ]}
        />
      </View>

      {/* ── Main content row ── */}
      <View style={styles.row}>
        {/* Cover placeholder */}
        <View style={[styles.cover, { backgroundColor: theme.colors.primary + '18' }]}>
          {hasSong ? (
            <Text style={[styles.coverText, { color: theme.colors.primary }]}>♪</Text>
          ) : (
            <View style={styles.coverBlank} />
          )}
        </View>

        {/* Song info or empty state */}
        <View style={styles.textWrap}>
          {hasSong ? (
            <>
              <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
                {title}
              </Text>
              <Text numberOfLines={1} style={[styles.subtitle, { color: theme.colors.mutedText }]}>
                {artist || 'Unknown Artist'}
              </Text>
            </>
          ) : (
            <Text numberOfLines={1} style={[styles.noSong, { color: theme.colors.mutedText }]}>
              No song is being played
            </Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              void togglePlayPause()
            }}
            hitSlop={10}
            style={[styles.playBtn, { backgroundColor: theme.colors.text }]}
            disabled={!hasSong}
          >
            <Feather
              name={progress.isPlaying ? 'pause' : 'play'}
              size={18}
              color={theme.colors.background}
            />
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              void next()
            }}
            hitSlop={10}
            style={styles.iconBtn}
            disabled={!hasSong}
          >
            <Feather name="skip-forward" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
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
    overflow: 'hidden',
    zIndex: 1,
  },

  progressTrack: {
    width: '100%',
    height: 3,
  },
  progressFill: {
    height: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 20,
  },
  coverBlank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.2,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  noSong: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 36,
    height: 36,
    paddingLeft: 4, // To center the play icon
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})