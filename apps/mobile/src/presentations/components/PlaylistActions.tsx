import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { useTheme } from './Theme'
import { useLanguage } from './Language'

interface PlaylistActionsProps {
  visible: boolean
  onClose: () => void
  playlistId: string
  playlistName: string
  onRename: () => void
  onDelete: () => void
  onDuplicate: () => void
  onPlayNext: () => void
  onAddToQueue: () => void
  onShuffle: () => void
}

export const PlaylistActions = ({
  visible,
  onClose,
  playlistId,
  playlistName,
  onRename,
  onDelete,
  onDuplicate,
  onPlayNext,
  onAddToQueue,
  onShuffle,
}: PlaylistActionsProps) => {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { colors } = theme

  const isLibraryPlaylist = playlistId === '0' || playlistId === 'all'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          
          <View style={styles.header}>
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary + '18' }]}>
              {isLibraryPlaylist ? (
                <Feather name="heart" size={24} color={colors.primary} />
              ) : (
                <Feather name="music" size={24} color={colors.primary} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                {playlistName}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {isLibraryPlaylist ? t.library.allSongs : 'Playlist'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Playing actions */}
          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => {
              onClose()
              onPlayNext()
            }}
          >
            <Feather name="corner-down-right" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t.playlists.playNext}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => {
              onClose()
              onAddToQueue()
            }}
          >
            <Feather name="plus-circle" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t.playlists.addToQueue}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => {
              onClose()
              onShuffle()
            }}
          >
            <Feather name="shuffle" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t.playlists.shuffle}</Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Duplicate */}
          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && { backgroundColor: colors.primary + '10' }
            ]}
            onPress={() => {
              onClose()
              onDuplicate()
            }}
          >
            <Feather name="copy" size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t.playlists.duplicate}</Text>
          </Pressable>

          {/* Editing actions (hidden for special playlists) */}
          {!isLibraryPlaylist && (
            <>
              {/* Rename */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionItem,
                  pressed && { backgroundColor: colors.primary + '10' }
                ]}
                onPress={() => {
                  onClose()
                  onRename()
                }}
              >
                <Feather name="edit-2" size={20} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t.playlists.rename}</Text>
              </Pressable>

              {/* Delete */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionItem,
                  pressed && { backgroundColor: '#FF5A5F10' }
                ]}
                onPress={() => {
                  onClose()
                  onDelete()
                }}
              >
                <Feather name="trash-2" size={20} color="#FF5A5F" />
                <Text style={[styles.actionText, { color: '#FF5A5F' }]}>{t.playlists.delete}</Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>{t.playlists.cancel}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

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
    gap: 16,
    marginBottom: 20,
  },
  coverPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 20,
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
