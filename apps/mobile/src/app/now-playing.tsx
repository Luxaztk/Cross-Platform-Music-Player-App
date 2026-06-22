import Slider from '@react-native-community/slider'
import { router } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../presentations/components/Theme'
import { usePlayerState, usePlayerProgress } from '../application/player'
import { useLanguage } from '../presentations/components/Language'
import { formatTime } from '../presentations/player/format'
import { QueueModal } from '../presentations/player/QueueModal'

import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'

export default function NowPlayingScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()

  const {
    currentSong,
    state,
    togglePlayPause,
    next,
    prev,
    seekTo,
    setVolume,
    toggleShuffle,
    setRepeatMode,
  } = usePlayerState()

  const progress = usePlayerProgress()

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [isQueueVisible, setIsQueueVisible] = useState(false)

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
      ? 'repeat-one'
      : state.repeatMode === 'ALL'
        ? 'repeat'
        : 'repeat'

  const isLoopOne = state.repeatMode === 'ONE'

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
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => [
          styles.backBtn,
          {
            backgroundColor: theme.colors.surfaceSolid,
            borderColor: theme.colors.subtleBorder,
            opacity: pressed ? 0.75 : 1,
          },
        ]}>
          <Feather name="chevron-down" size={20} color={theme.colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.colors.mutedText }]}>
          Đang phát
        </Text>

        <Pressable
          onPress={() => setIsQueueVisible(true)}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerRight,
            {
              backgroundColor: theme.colors.surfaceSolid,
              borderColor: theme.colors.subtleBorder,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Feather name="more-vertical" size={20} color={theme.colors.text} />
        </Pressable>
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

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          hitSlop={10}
        >
          <Feather name="music" size={18} color={theme.colors.primary} />
          <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Lyrics</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          hitSlop={10}
        >
          <Feather name="plus" size={18} color={theme.colors.primary} />
          <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Add to Playlist</Text>
        </Pressable>
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
          onPress={() => !isLoopOne && void toggleShuffle()}
          style={[styles.sideBtn, isLoopOne && { opacity: 0.3 }]}
          hitSlop={10}
          disabled={isLoopOne}
        >
          <MaterialIcons
            name="shuffle"
            size={24}
            color={
              state.isShuffle ? theme.colors.primary : theme.colors.mutedText
            }
          />
        </Pressable>

        <Pressable onPress={() => void prev()} style={styles.controlBtn} hitSlop={10}>
          <MaterialIcons
            name="skip-previous"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>

        <Pressable
          onPress={() => void togglePlayPause()}
          style={[styles.playBtn, { backgroundColor: theme.colors.text }]}
        >
          <MaterialIcons
            name={progress.isPlaying ? 'pause' : 'play-arrow'}
            size={24}
            color={theme.colors.background}
          />
        </Pressable>

        <Pressable onPress={() => void next()} style={styles.controlBtn} hitSlop={10}>
          <MaterialIcons name="skip-next" size={24} color={theme.colors.text} />
        </Pressable>

        <Pressable onPress={cycleRepeat} style={styles.sideBtn} hitSlop={10}>
          <MaterialIcons
            name={repeatLabel}
            size={24}
            color={
              state.repeatMode !== 'OFF'
                ? theme.colors.primary
                : theme.colors.mutedText
            }
          />
        </Pressable>
      </View>

      {/* Volume */}
      <View
        style={[
          styles.volumeCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            marginBottom: insets.bottom + 20,
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

      <QueueModal
        visible={isQueueVisible}
        onClose={() => setIsQueueVisible(false)}
      />
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  queueIcon: {
    fontSize: 24,
    fontWeight: '600',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
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
    display: "none"
  },
  volumeIcon: {
    fontSize: 16,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
})