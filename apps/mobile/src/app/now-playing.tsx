import Slider from '@react-native-community/slider'
import { router } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../presentations/components/Theme'
import { useLibraryContext, usePlayer } from '@music/hooks'
import { useLanguage } from '../presentations/components/Language'
import { useNotifications } from '../presentations/components/Notification'
import { formatTime } from '../presentations/player/format'
import { QueueModal } from '../presentations/player/QueueModal'
import { MobileOfflineService } from '../infrastructure/services/MobileOfflineService'

import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'

export default function NowPlayingScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const { notify } = useNotifications()
  const { handlePatchSong } = useLibraryContext()
  const [isDownloading, setIsDownloading] = useState(false)

  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    repeatMode,
    isShuffle,
    play,
    pause,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    setRepeatMode,
  } = usePlayer()

  const togglePlayPause = () => { isPlaying ? pause() : play() }

  const positionMs = progress * 1000
  const durationMs = (duration || 1) * 1000

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)
  const [isQueueVisible, setIsQueueVisible] = useState(false)

  const currentPositionMs = isSeeking ? seekValue : positionMs

  const cycleRepeat = useCallback(() => {
    const modes = ['OFF', 'ALL', 'ONE'] as const
    const idx = modes.indexOf(repeatMode)
    const nextMode = modes[(idx + 1) % modes.length]
    void setRepeatMode(nextMode)
  }, [repeatMode, setRepeatMode])

  const handleToggleOffline = useCallback(async () => {
    if (!currentSong) return
    if (currentSong.isOffline) {
      const res = await MobileOfflineService.removeOfflineSong(currentSong, handlePatchSong)
      if (res.ok) {
        notify({ message: t.songs.removeOfflineSuccess, kind: 'success' })
      }
    } else {
      setIsDownloading(true)
      notify({ message: t.songs.downloading, kind: 'info' })
      try {
        const res = await MobileOfflineService.downloadSongForOffline(currentSong, handlePatchSong)
        if (res.ok) {
          notify({ message: t.songs.downloadSuccess, kind: 'success' })
        } else {
          notify({ message: res.error || 'Tải bài hát thất bại', kind: 'error' })
        }
      } finally {
        setIsDownloading(false)
      }
    }
  }, [currentSong, handlePatchSong, notify, t])

  const repeatLabel =
    repeatMode === 'ONE'
      ? 'repeat-one'
      : 'repeat'

  const isLoopOne = repeatMode === 'ONE'

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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {currentSong && (currentSong.sourceType === 'stream' || currentSong.isOffline) && (
            <Pressable
              onPress={handleToggleOffline}
              disabled={isDownloading}
              hitSlop={12}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  backgroundColor: theme.colors.surfaceSolid,
                  borderColor: currentSong.isOffline ? '#3B82F6' : theme.colors.subtleBorder,
                  opacity: pressed || isDownloading ? 0.75 : 1,
                },
              ]}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Feather
                  name={currentSong.isOffline ? 'check-circle' : 'download-cloud'}
                  size={18}
                  color={currentSong.isOffline ? '#3B82F6' : theme.colors.text}
                />
              )}
            </Pressable>
          )}

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
            <MaterialIcons name="queue-music" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {currentSong?.title ?? 'Chưa chọn bài hát'}
          </Text>
          {currentSong?.isOffline ? (
            <View
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderWidth: 1,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Feather name="check-circle" size={10} color="#3B82F6" />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: '#3B82F6',
                  letterSpacing: 0.5,
                }}
              >
                OFFLINE
              </Text>
            </View>
          ) : currentSong?.sourceType === 'stream' ? (
            <View
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                borderWidth: 1,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: theme.colors.primary,
                  letterSpacing: 0.5,
                }}
              >
                STREAM
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.subtitle, { color: theme.colors.mutedText }]}
          numberOfLines={1}
        >
          {currentSong?.artist ?? 'Unknown Artist'}
        </Text>

        {/* {currentSong?.album ? (
          <Text
            style={[styles.album, { color: theme.colors.mutedText }]}
            numberOfLines={1}
          >
            {currentSong.album}
          </Text>
        ) : null} */}
      </View>

      {/* Action buttons */}
      {/* <View style={styles.actionButtons}>
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
      </View> */}

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
            setSeekValue(positionMs)
          }}
          onValueChange={setSeekValue}
          onSlidingComplete={(v) => {
            setIsSeeking(false)
            void seek(v / 1000)
          }}
        />

        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: theme.colors.mutedText }]}>
            {formatTime(currentPositionMs)}
          </Text>
          <Text style={[styles.time, { color: theme.colors.mutedText }]}>
            {formatTime(durationMs)}
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
              isShuffle ? theme.colors.primary : theme.colors.mutedText
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
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={32}
            color={theme.colors.background}
            style={!isPlaying ? { marginLeft: 4 } : undefined}
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
              repeatMode !== 'OFF'
                ? theme.colors.primary
                : theme.colors.mutedText
            }
          />
        </Pressable>
      </View>

      {/* Volume */}
      {/* <View
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
          value={volume}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          onSlidingComplete={(v) => void setVolume(v)}
        />

        <Text style={[styles.volumeIcon, { color: theme.colors.mutedText }]}>🔊</Text>
      </View> */}

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
    gap: 8
  },
  volumeIcon: {
    fontSize: 16,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
})