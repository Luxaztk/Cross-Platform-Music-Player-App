import Slider from '@react-native-community/slider'
import { router } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../theme'
import { usePlayerState, usePlayerProgress } from '../application/player'
import { formatTime } from '../presentations/player/format'

export default function NowPlayingScreen() {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  const {
    currentSong,
    state,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    setShuffle,
    setRepeatMode,
  } = usePlayerState()

  const progress = usePlayerProgress()

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  const durationMs = progress.durationMs || 1
  const positionMs = isSeeking ? seekValue : progress.positionMs

  const cycleRepeat = useCallback(() => {
    const modes = ['OFF', 'ALL', 'ONE'] as const
    const idx = modes.indexOf(state.repeatMode)
    const next = modes[(idx + 1) % modes.length]
    void setRepeatMode(next)
  }, [state.repeatMode, setRepeatMode])

  const repeatLabel =
    state.repeatMode === 'ONE'
      ? '🔂'
      : state.repeatMode === 'ALL'
        ? '🔁'
        : '➡️'

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.colors.text }]}>←</Text>
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.colors.mutedText }]}>
          Đang phát
        </Text>

        <View style={styles.headerRight} />
      </View>

      {/* Album art */}
      <View
        style={[
          styles.artContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.artInner,
            { backgroundColor: theme.colors.primary + '18' },
          ]}
        >
          <Text style={[styles.artLogo, { color: theme.colors.primary }]}>M</Text>
        </View>
      </View>

      {/* Song info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {currentSong?.title ?? 'Chưa chọn bài hát'}
        </Text>

        <Text
          style={[styles.subtitle, { color: theme.colors.mutedText }]}
          numberOfLines={1}
        >
          {currentSong?.artist ?? 'Unknown Artist'}
        </Text>

        {currentSong?.album ? (
          <Text
            style={[styles.album, { color: theme.colors.mutedText }]}
            numberOfLines={1}
          >
            {currentSong.album}
          </Text>
        ) : null}
      </View>

      {/* Seek bar */}
      <View style={styles.seekSection}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={durationMs}
          value={positionMs}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          onSlidingStart={() => {
            setIsSeeking(true)
            setSeekValue(progress.positionMs)
          }}
          onValueChange={setSeekValue}
          onSlidingComplete={(v) => {
            setIsSeeking(false)
            void seekTo(v)
          }}
        />

        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: theme.colors.mutedText }]}>
            {formatTime(positionMs)}
          </Text>
          <Text style={[styles.time, { color: theme.colors.mutedText }]}>
            {formatTime(progress.durationMs)}
          </Text>
        </View>
      </View>

      {/* Main controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={() => void setShuffle(!state.isShuffle)}
          style={styles.sideBtn}
          hitSlop={10}
        >
          <Text
            style={[
              styles.sideIcon,
              {
                color: state.isShuffle
                  ? theme.colors.primary
                  : theme.colors.mutedText,
              },
            ]}
          >
            🔀
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void playPrevious()}
          style={styles.controlBtn}
          hitSlop={10}
        >
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>⏮</Text>
        </Pressable>

        <Pressable
          onPress={() => void togglePlayPause()}
          style={[styles.playBtn, { backgroundColor: theme.colors.text }]}
        >
          <Text style={[styles.playIcon, { color: theme.colors.background }]}>
            {progress.isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void playNext()}
          style={styles.controlBtn}
          hitSlop={10}
        >
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>⏭</Text>
        </Pressable>

        <Pressable onPress={cycleRepeat} style={styles.sideBtn} hitSlop={10}>
          <Text
            style={[
              styles.sideIcon,
              {
                color:
                  state.repeatMode !== 'OFF'
                    ? theme.colors.primary
                    : theme.colors.mutedText,
              },
            ]}
          >
            {repeatLabel}
          </Text>
        </Pressable>
      </View>

      {/* Volume */}
      <View
        style={[
          styles.volumeCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.volumeIcon, { color: theme.colors.mutedText }]}>🔈</Text>

        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={state.volume}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          onSlidingComplete={(v) => void setVolume(v)}
        />

        <Text style={[styles.volumeIcon, { color: theme.colors.mutedText }]}>🔊</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 20,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 26,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerRight: {
    width: 44,
    height: 44,
  },
  artContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artInner: {
    width: '78%',
    aspectRatio: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artLogo: {
    fontSize: 90,
    fontWeight: '900',
  },
  info: {
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  album: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
  },
  seekSection: {
    gap: 2,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
  },
  controls: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  sideBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideIcon: {
    fontSize: 20,
  },
  controlBtn: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 28,
    fontWeight: '800',
  },
  playBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 30,
    fontWeight: '800',
  },
  volumeCard: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeIcon: {
    fontSize: 16,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
})