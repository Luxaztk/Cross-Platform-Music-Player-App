import React from 'react'
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import type { Song } from '@music/types'
import { useTheme } from './Theme'
import { useLanguage } from './Language'

interface SongActionsProps {
  visible: boolean
  onClose: () => void
  song: Song | null
  /** Whether the song is inside a custom playlist (shows remove / move actions) */
  inPlaylist: boolean
  /** Whether the song can be permanently deleted from the library */
  canDelete: boolean
  onPlayNext: () => void
  onAddToQueue: () => void
  onAddToPlaylist: () => void
  onMoveToPlaylist: () => void
  onRemoveFromPlaylist: () => void
  onDeleteFromLibrary: () => void
}

export const SongActions = ({
  visible,
  onClose,
  song,
  inPlaylist,
  canDelete,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onMoveToPlaylist,
  onRemoveFromPlaylist,
  onDeleteFromLibrary,
}: SongActionsProps) => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { colors } = theme

  if (!song) return null

  const action = (fn: () => void) => () => { onClose(); fn() }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Song header */}
          <View style={styles.header}>
            {song.coverArt ? (
              <Image source={{ uri: song.coverArt }} style={styles.cover} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="music" size={22} color={colors.primary} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text numberOfLines={1} style={[styles.songTitle, { color: colors.text }]}>
                {song.title}
              </Text>
              <Text numberOfLines={1} style={[styles.songArtist, { color: colors.mutedText }]}>
                {song.artist}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Playback actions */}
          <ActionItem
            icon="corner-down-right"
            label={t.songs.playNext}
            colors={colors}
            onPress={action(onPlayNext)}
          />
          <ActionItem
            icon="plus-circle"
            label={t.songs.addToQueue}
            colors={colors}
            onPress={action(onAddToQueue)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Playlist actions */}
          <ActionItem
            icon="list"
            label={t.songs.addToPlaylist}
            colors={colors}
            onPress={action(onAddToPlaylist)}
          />
          {inPlaylist && (
            <>
              <ActionItem
                icon="shuffle"
                label={t.songs.moveToPlaylist}
                colors={colors}
                onPress={action(onMoveToPlaylist)}
              />
              <ActionItem
                icon="x-circle"
                label={t.songs.removeFromPlaylist}
                colors={colors}
                destructive
                onPress={action(onRemoveFromPlaylist)}
              />
            </>
          )}
          {canDelete && (
            <ActionItem
              icon="trash-2"
              label={t.songs.deleteFromLibrary}
              colors={colors}
              destructive
              onPress={action(onDeleteFromLibrary)}
            />
          )}

          {/* Cancel */}
          <Pressable
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>
              {t.playlists.cancel}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

// ── Private helper ──────────────────────────────────────────────────────────

type ActionItemProps = {
  icon: React.ComponentProps<typeof Feather>['name']
  label: string
  destructive?: boolean
  colors: { text: string; mutedText: string; primary: string }
  onPress: () => void
}

const ActionItem = ({ icon, label, destructive, colors, onPress }: ActionItemProps) => {
  const iconColor = destructive ? '#FF5A5F' : colors.text
  const textColor = destructive ? '#FF5A5F' : colors.text
  const pressedBg = destructive ? '#FF5A5F10' : colors.primary + '10'
  return (
    <Pressable
      style={({ pressed }) => [styles.actionItem, pressed && { backgroundColor: pressedBg }]}
      onPress={onPress}
    >
      <Feather name={icon} size={20} color={iconColor} />
      <Text style={[styles.actionText, { color: textColor }]}>{label}</Text>
    </Pressable>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  coverPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  songArtist: {
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
})
