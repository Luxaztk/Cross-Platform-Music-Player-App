import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'

import type { Playlist, Song } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { SongActions } from '../../presentations/components/SongActions'
import { useLibraryContext, usePlayer } from '@music/hooks'

// ── Utilities ───────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

type SortOption = 'title' | 'artist' | 'duration' | 'dateAdded'

const sortSongs = (songs: Song[], option: SortOption): Song[] => {
  const sorted = [...songs]
  switch (option) {
    case 'artist':
      return sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title))
    case 'duration':
      return sorted.sort((a, b) => a.duration - b.duration)
    case 'dateAdded':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.dateAdded || 0).getTime()
        const bDate = new Date(b.dateAdded || 0).getTime()
        return bDate - aDate
      })
    case 'title':
    default:
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
  }
}

// ── Song row for playlist ───────────────────────────────────────

const PlaylistSongRow = React.memo(function PlaylistSongRow({
  item,
  isActive,
  onPress,
  onOpenActions,
  colors,
}: {
  item: Song
  isActive: boolean
  onPress: (id: string) => void
  onOpenActions: (song: Song) => void
  colors: {
    surface: string
    border: string
    text: string
    mutedText: string
    primary: string
  }
}) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[
        styles.row,
        {
          backgroundColor: isActive ? colors.primary + '18' : colors.surface,
          borderColor: isActive ? colors.primary + '44' : colors.border,
        },
      ]}
    >
      {/* Cover art */}
      {item.coverArt ? (
        <Image source={{ uri: item.coverArt }} style={styles.cover} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary + '18' }]}>
          <Feather name="music" size={18} color={colors.primary} />
        </View>
      )}

      {/* Song info */}
      <View style={styles.rowInfo}>
        <Text
          numberOfLines={1}
          style={[styles.rowTitle, { color: isActive ? colors.primary : colors.text }]}
        >
          {item.title}
        </Text>
        <View style={styles.rowMeta}>
          <Text numberOfLines={1} style={[styles.rowArtist, { color: colors.mutedText }]}>
            {item.artist}
          </Text>
          <Text style={[styles.rowDuration, { color: colors.mutedText }]}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      </View>

      {/* Action button */}
      <Pressable
        onPress={() => onOpenActions(item)}
        hitSlop={10}
        style={styles.actionBtn}
      >
        <Feather name="more-vertical" size={20} color={colors.mutedText} />
      </Pressable>
    </Pressable>
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
        <Text numberOfLines={1} style={[styles.selectionTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.selectionSubtitle, { color: colors.mutedText }]}>
          {item.artist}
        </Text>
      </View>
      <View
        style={[
          styles.checkbox,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
      >
        {isSelected && <Text style={styles.checkboxText}>✓</Text>}
      </View>
    </Pressable>
  )
})

const PlaylistTargetRow = React.memo(function PlaylistTargetRow({
  item,
  onSelect,
  colors,
  chooseLabel,
}: {
  item: Playlist
  onSelect: (id: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
  chooseLabel: string
}) {
  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={[
        styles.selectionRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.selectionInfo}>
        <Text numberOfLines={1} style={[styles.selectionTitle, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.selectionSubtitle, { color: colors.mutedText }]}>
          {item.songIds.length}
        </Text>
      </View>

      <Text style={[styles.chooseText, { color: colors.primary }]}>{chooseLabel}</Text>
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
    playlists,
    songs,
    library,
    handleRemoveSongsFromPlaylist,
    handleAddSongsToPlaylist
  } = useLibraryContext()
  const { playList, currentSong } = usePlayer()

  const [addModalVisible, setAddModalVisible] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('title')
  const [sortMenuVisible, setSortMenuVisible] = useState(false)

  // SongActions state
  const [selectedSongForActions, setSelectedSongForActions] = useState<Song | null>(null)
  const [songActionsVisible, setSongActionsVisible] = useState(false)

  const playlist = useMemo(() => {
    if (id === 'all' || id === '0') {
      return {
        id: 'all',
        name: t.library.allSongs,
        songIds: library?.songIds || [],
      } as Playlist
    }
    return playlists.find(p => p.id === id) || null
  }, [id, playlists, library, t])

  const playlistSongs = useMemo(() => {
    if (!playlist) return []
    const mappedSongs = playlist.songIds.map((sid) => songs.find(s => s.id === sid)).filter(Boolean) as Song[]
    return sortSongs(mappedSongs, sortBy)
  }, [playlist, songs, sortBy])

  const allLibrarySongs = useMemo(() => {
    return [...songs].sort((a, b) => a.title.localeCompare(b.title))
  }, [songs])

  const availableToAdd = useMemo(() => {
    if (!playlist) return allLibrarySongs
    return allLibrarySongs.filter((s) => !playlist.songIds.includes(s.id))
  }, [allLibrarySongs, playlist])

  const otherPlaylists = useMemo(() => {
    return playlists
      .filter((p) => p.id !== '0' && p.id !== id)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [playlists, id])

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return playlistSongs.reduce((sum, song) => sum + song.duration, 0)
  }, [playlistSongs])

  const onPlayAll = useCallback(async () => {
    if (!playlist || playlistSongs.length === 0) return
    try {
      playList(playlistSongs, 0)
    } catch {
      notify({ message: t.library.playbackFailed, kind: 'error' })
    }
  }, [playlist, playlistSongs, playList, notify, t])

  const onRemoveSong = useCallback(
    async (songId: string) => {
      if (handleRemoveSongsFromPlaylist) {
        await handleRemoveSongsFromPlaylist(id, [songId])
        notify({ message: t.playlists.songsRemoved(1), kind: 'success' })
      }
    },
    [id, handleRemoveSongsFromPlaylist, notify, t],
  )

  const onPlaySong = useCallback(
    async (songId: string) => {
      if (!playlist) return
      try {
        const idx = playlistSongs.findIndex(s => s.id === songId)
        playList(playlistSongs, idx >= 0 ? idx : 0)
      } catch {
        notify({ message: t.library.playbackFailed, kind: 'error' })
      }
    },
    [playlist, playlistSongs, playList, notify, t],
  )

  const onToggleSelect = useCallback((sid: string) => {
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }, [])

  const onConfirmAdd = useCallback(async () => {
    if (selectedIds.length === 0) return
    if (handleAddSongsToPlaylist) {
      await handleAddSongsToPlaylist(id, selectedIds)
      notify({ message: t.playlists.songsAdded(selectedIds.length), kind: 'success' })
    }
    setAddModalVisible(false)
    setSelectedIds([])
  }, [id, selectedIds, handleAddSongsToPlaylist, notify, t])

  // SongActions handlers
  const onOpenSongActions = useCallback((song: Song) => {
    setSelectedSongForActions(song)
    setSongActionsVisible(true)
  }, [])

  const onCloseSongActions = useCallback(() => {
    setSongActionsVisible(false)
    setSelectedSongForActions(null)
  }, [])

  const onPlayNext = useCallback(() => {
    notify({ message: 'Play next coming soon', kind: 'info' })
  }, [notify])

  const onAddToQueue = useCallback(() => {
    notify({ message: 'Add to queue coming soon', kind: 'info' })
  }, [notify])

  const onAddToPlaylist = useCallback(() => {
    if (selectedSongForActions) {
      setSelectedIds([selectedSongForActions.id])
      setAddModalVisible(true)
      onCloseSongActions()
    }
  }, [selectedSongForActions, onCloseSongActions])

  const onMoveToPlaylist = useCallback(() => {
    notify({ message: 'Move to playlist coming soon', kind: 'info' })
  }, [notify])

  const onRemoveFromPlaylist = useCallback(() => {
    if (selectedSongForActions && id !== 'all' && id !== '0') {
      onRemoveSong(selectedSongForActions.id)
      onCloseSongActions()
    }
  }, [selectedSongForActions, id, onRemoveSong, onCloseSongActions])

  const onDeleteFromLibrary = useCallback(() => {
    notify({ message: 'Delete from library coming soon', kind: 'info' })
  }, [notify])

  if (!playlist) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>Playlist not found</Text>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header with title and duration */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {playlist.name}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              {t.playlists.songCount(playlistSongs.length)}
            </Text>
            {playlistSongs.length > 0 && (
              <>
                <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>•</Text>
                <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
                  {formatDuration(totalDuration)}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Action buttons and sort options */}
      <View style={styles.actions}>
        <Pressable
          onPress={onPlayAll}
          disabled={playlistSongs.length === 0}
          style={[
            styles.mainBtn,
            {
              backgroundColor: theme.colors.primary,
              opacity: playlistSongs.length === 0 ? 0.5 : 1,
            },
          ]}
        >
          <Text style={styles.mainBtnText}>▶ {t.playlists.playAll}</Text>
        </Pressable>

        {id !== 'all' && id !== '0' && (
          <Pressable
            onPress={() => {
              setSelectedIds([])
              setAddModalVisible(true)
            }}
            style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.outlineBtnText, { color: theme.colors.text }]}>
              ＋ {t.playlists.addSongs}
            </Text>
          </Pressable>
        )}

        {playlistSongs.length > 0 && (
          <Pressable
            onPress={() => setSortMenuVisible(!sortMenuVisible)}
            style={[styles.sortBtn, { borderColor: theme.colors.border }]}
          >
            <Feather name="filter" size={18} color={theme.colors.text} />
          </Pressable>
        )}
      </View>

      {/* Sort menu */}
      {sortMenuVisible && (
        <View style={[styles.sortMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {(['title', 'artist', 'duration', 'dateAdded'] as SortOption[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setSortBy(option)
                setSortMenuVisible(false)
              }}
              style={styles.sortMenuItem}
            >
              <Feather
                name={sortBy === option ? 'check' : 'circle'}
                size={16}
                color={sortBy === option ? theme.colors.primary : theme.colors.mutedText}
              />
              <Text
                style={[
                  styles.sortMenuText,
                  {
                    color: sortBy === option ? theme.colors.primary : theme.colors.text,
                    fontWeight: sortBy === option ? '700' : '500',
                  },
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Songs list */}
      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaylistSongRow
            item={item}
            isActive={item.id === currentSong?.id}
            onPress={onPlaySong}
            onOpenActions={onOpenSongActions}
            colors={theme.colors}
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

      {/* Add songs modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent={false}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background, paddingTop: insets.top },
          ]}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setAddModalVisible(false)} hitSlop={15}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>
                {t.playlists.cancel}
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t.playlists.addSongs}
            </Text>
            <Pressable onPress={onConfirmAdd} disabled={selectedIds.length === 0} hitSlop={15}>
              <Text
                style={[
                  styles.modalConfirm,
                  {
                    color: theme.colors.primary,
                    opacity: selectedIds.length === 0 ? 0.4 : 1,
                  },
                ]}
              >
                {t.playlists.addSongs} ({selectedIds.length})
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={availableToAdd}
            keyExtractor={(item) => item.id}
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

      {/* Song actions modal */}
      <SongActions
        visible={songActionsVisible}
        onClose={onCloseSongActions}
        song={selectedSongForActions}
        inPlaylist={id !== 'all' && id !== '0'}
        canDelete={false}
        onPlayNext={onPlayNext}
        onAddToQueue={onAddToQueue}
        onAddToPlaylist={onAddToPlaylist}
        onMoveToPlaylist={onMoveToPlaylist}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
        onDeleteFromLibrary={onDeleteFromLibrary}
      />
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
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
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
  sortBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortMenu: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  sortMenuText: {
    fontSize: 14,
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
  cover: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowArtist: {
    fontSize: 12,
    flex: 1,
  },
  rowDuration: {
    fontSize: 12,
  },
  actionBtn: {
    padding: 8,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
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
  checkboxText: {
    color: '#fff',
    fontSize: 10,
  },
  chooseText: {
    fontSize: 13,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  pickerSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyPickerWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  closeBtn: {
    marginTop: 14,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
})