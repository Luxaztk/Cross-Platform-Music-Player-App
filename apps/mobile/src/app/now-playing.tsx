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
    state.repeatMode === 'ONE' ? '🔂' : state.repeatMode === 'ALL' ? '🔁' : '➡️'

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Drag handle / dismiss */}
      <Pressable onPress={() => router.back()} style={styles.handleArea} hitSlop={12}>
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
      </Pressable>

      {/* Album art placeholder */}
      <View style={[styles.artContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.artEmoji, { color: theme.colors.primary }]}>🎵</Text>
      </View>

      {/* Song info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {currentSong?.title ?? 'Nothing playing'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedText }]} numberOfLines={1}>
          {currentSong?.artist ?? ''}
        </Text>
        {currentSong?.album ? (
          <Text style={[styles.album, { color: theme.colors.mutedText }]} numberOfLines={1}>
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
        <Pressable onPress={() => void setShuffle(!state.isShuffle)} style={styles.sideBtn} hitSlop={10}>
          <Text style={[styles.sideIcon, { color: state.isShuffle ? theme.colors.primary : theme.colors.mutedText }]}>
            🔀
          </Text>
        </Pressable>

        <Pressable onPress={() => void playPrevious()} style={styles.controlBtn} hitSlop={10}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>⏮</Text>
        </Pressable>

        <Pressable
          onPress={() => void togglePlayPause()}
          style={[styles.playBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.playIcon}>
            {progress.isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>

        <Pressable onPress={() => void playNext()} style={styles.controlBtn} hitSlop={10}>
          <Text style={[styles.controlIcon, { color: theme.colors.text }]}>⏭</Text>
        </Pressable>

        <Pressable onPress={cycleRepeat} style={styles.sideBtn} hitSlop={10}>
          <Text style={[styles.sideIcon, { color: state.repeatMode !== 'OFF' ? theme.colors.primary : theme.colors.mutedText }]}>
            {repeatLabel}
          </Text>
        </Pressable>
      </View>

      {/* Volume */}
      <View style={styles.volumeRow}>
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
    paddingHorizontal: 28,
    gap: 16,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  artContainer: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artEmoji: {
    fontSize: 64,
  },
  info: {
    gap: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  album: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  sideBtn: {
    padding: 8,
  },
  sideIcon: {
    fontSize: 20,
  },
  controlBtn: {
    padding: 10,
  },
  controlIcon: {
    fontSize: 28,
    fontWeight: '800',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  volumeRow: {
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
