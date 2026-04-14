import Slider from '@react-native-community/slider'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { Song } from '@music/types'

import { useTheme } from '../../theme'
import { useLanguage } from '../../i18n'
import { useNotifications } from '../../notifications'
import { useLibrary } from '../../application'
import { usePlayer } from '../../application/player'
import { formatTime } from '../../presentations/player/format'

// ── Song row for playlist ───────────────────────────────────────

const PlaylistSongRow = React.memo(function PlaylistSongRow({
  item,
  isActive,
  onPress,
  onRemove,
  colors,
  strings,
}: {
  item: Song
  isActive: boolean
  onPress: (id: string) => void
  onRemove: (id: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
  strings: { remove: string }
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isActive ? colors.primary + '18' : colors.surface,
          borderColor: isActive ? colors.primary + '44' : colors.border,
        },
      ]}
    >
      <Pressable onPress={() => onPress(item.id)} style={styles.rowMain}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: isActive ? colors.primary : colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.mutedText }]}>
          {item.artist}
        </Text>
      </Pressable>
      
      <Pressable onPress={() => onRemove(item.id)} hitSlop={10} style={styles.removeBtn}>
        <Text style={[styles.removeIcon, { color: colors.mutedText }]}>✕</Text>
      </Pressable>
    </View>
  )
})

// ── Selection row for "Add Songs" modal ─────────────────────────

const SelectionRow = React.memo(function SelectionRow({
  item,
  isSelected,
  onToggle,
  colors,
}: {
  item: Song
  isSelected: boolean
  onToggle: (id: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
}) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      style={[
        styles.selectionRow,
        {
          backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.selectionInfo}>
        <Text numberOfLines={1} style={[styles.selectionTitle, { color: colors.text }]}>{item.title}</Text>
        <Text numberOfLines={1} style={[styles.selectionSubtitle, { color: colors.mutedText }]}>{item.artist}</Text>
      </View>
      <View style={[styles.checkbox, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : 'transparent' }]}>
        {isSelected && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
      </View>
    </Pressable>
  )
})

// ── Main Screen ─────────────────────────────────────────────────

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const insets = useSafeAreaInsets()
  
  const { 
    playlistsById, 
    songsById, 
    addSongsToPlaylist, 
    removeSongsFromPlaylist 
  } = useLibrary()
  
  const { playFromQueue, state: playerState } = usePlayer()

  const [addModalVisible, setAddModalVisible] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const playlist = playlistsById[id]
  
  const playlistSongs = useMemo(() => {
    if (!playlist) return []
    return playlist.songIds.map(sid => songsById[sid]).filter(Boolean) as Song[]
  }, [playlist, songsById])

  const allLibrarySongs = useMemo(() => {
    return Object.values(songsById).sort((a, b) => a.title.localeCompare(b.title))
  }, [songsById])

  const availableToAdd = useMemo(() => {
    if (!playlist) return allLibrarySongs
    return allLibrarySongs.filter(s => !playlist.songIds.includes(s.id))
  }, [allLibrarySongs, playlist])

  // ── Handlers ────────────────────────────

  const onPlayAll = useCallback(async () => {
    if (playlistSongs.length === 0) return
    const res = await playFromQueue(playlist.songIds, playlist.songIds[0])
    if (!res.ok) {
      notify({ message: t.library.playbackFailed, kind: 'error' })
    }
  }, [playlist, playlistSongs, playFromQueue, notify, t])

  const onRemoveSong = useCallback(async (songId: string) => {
    await removeSongsFromPlaylist(id, [songId])
    notify({ message: t.playlists.songsRemoved(1), kind: 'success' })
  }, [id, removeSongsFromPlaylist, notify, t])

  const onPlaySong = useCallback(async (songId: string) => {
    const res = await playFromQueue(playlist.songIds, songId)
    if (!res.ok) {
      notify({ message: t.library.playbackFailed, kind: 'error' })
    }
  }, [playlist, playFromQueue, notify, t])

  const onToggleSelect = useCallback((sid: string) => {
    setSelectedIds(prev => 
      prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
    )
  }, [])

  const onConfirmAdd = useCallback(async () => {
    if (selectedIds.length === 0) return
    await addSongsToPlaylist(id, selectedIds)
    notify({ message: t.playlists.songsAdded(selectedIds.length), kind: 'success' })
    setAddModalVisible(false)
    setSelectedIds([])
  }, [id, selectedIds, addSongsToPlaylist, notify, t])

  if (!playlist) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Playlist not found</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={15}>
          <Text style={[styles.backIcon, { color: theme.colors.text }]}>←</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>{playlist.name}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            {t.playlists.songCount(playlistSongs.length)}
          </Text>
        </View>
      </View>

      {/* Primary Actions */}
      <View style={styles.actions}>
        <Pressable 
          onPress={onPlayAll} 
          disabled={playlistSongs.length === 0}
          style={[styles.mainBtn, { backgroundColor: theme.colors.primary, opacity: playlistSongs.length === 0 ? 0.5 : 1 }]}
        >
          <Text style={styles.mainBtnText}>▶ {t.playlists.playAll}</Text>
        </Pressable>
        <Pressable 
          onPress={() => {
            setSelectedIds([])
            setAddModalVisible(true)
          }} 
          style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.outlineBtnText, { color: theme.colors.text }]}>＋ {t.playlists.addSongs}</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={playlistSongs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlaylistSongRow 
            item={item}
            isActive={item.id === playerState.currentSongId}
            onPress={onPlaySong}
            onRemove={onRemoveSong}
            colors={theme.colors}
            strings={{ remove: t.playlists.removeSong }}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              {t.playlists.emptyPlaylist}
            </Text>
          </View>
        }
      />

      {/* Add Songs Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={false}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setAddModalVisible(false)} hitSlop={15}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>{t.playlists.cancel}</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t.playlists.addSongs}</Text>
            <Pressable 
              onPress={onConfirmAdd} 
              disabled={selectedIds.length === 0}
              hitSlop={15}
            >
              <Text style={[styles.modalConfirm, { color: theme.colors.primary, opacity: selectedIds.length === 0 ? 0.4 : 1 }]}>
                {t.playlists.addSongs} ({selectedIds.length})
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={availableToAdd}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <SelectionRow 
                item={item} 
                isSelected={selectedIds.includes(item.id)} 
                onToggle={onToggleSelect}
                colors={theme.colors}
              />
            )}
            contentContainerStyle={[styles.modalListContent, { paddingBottom: insets.bottom + 20 }]}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  mainBtn: {
    flex: 2,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 12,
  },
  removeBtn: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  modalClose: {
    fontSize: 15,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalConfirm: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalListContent: {
    padding: 20,
    gap: 12,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectionInfo: {
    flex: 1,
    gap: 2,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionSubtitle: {
    fontSize: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
