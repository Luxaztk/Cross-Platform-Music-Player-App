import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'

import type { Playlist, Song } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { SongActions } from '../../presentations/components/SongActions'
import { useLibrary } from '../../application'
import { usePlayer } from '../../application/player'
import { useAppShell } from '../../presentations/components/AppShell'

// ── Utilities ───────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

type SortOption = 'sortTitle' | 'sortArtist' | 'sortDuration' | 'sortDateAdded'

const sortSongs = (songs: Song[], option: SortOption): Song[] => {
  const sorted = [...songs]
  switch (option) {
    case 'sortArtist':
      return sorted.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title))
    case 'sortDuration':
      return sorted.sort((a, b) => a.duration - b.duration)
    case 'sortDateAdded':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.dateAdded || 0).getTime()
        const bDate = new Date(b.dateAdded || 0).getTime()
        return bDate - aDate
      })
    case 'sortTitle':
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
        {isSelected && <Text style={styles.checkboxText}></Text>}
      </View>
    </Pressable>
  )
})

const PlaylistTargetRow = React.memo(function PlaylistTargetRow({
  item,
  onSelect,
  isSelected,
  colors,
  chooseLabel,
}: {
  item: Playlist
  onSelect: (id: string) => void
  isSelected: boolean
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
  chooseLabel: string
}) {
  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={[
        styles.selectionRow,
        { 
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
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

      <View
        style={[
          styles.checkbox,
          {
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
      >
        {isSelected && <Text style={styles.checkboxText}></Text>}
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

  const { setCustomTitle } = useAppShell()
  useEffect(() => {
    setCustomTitle(playlist?.name || t.playlists.title) // Reset custom title when entering the screen
  }, [setCustomTitle])

  const {
    playlistsById,
    songsById,
    library,
    addSongsToPlaylist,
    removeSongsFromPlaylist,
    patchSong,
    deleteSongs
  } = useLibrary()
  const { playNextSongs, addSongsToQueue, playList, state: playerState } = usePlayer()

  const [addSongsToPlaylistModalVisible, setAddSongsToPlaylistModalVisible] = useState(false)
  const [selectedSongsIds, setSelectedSongsIds] = useState<string[]>([])
  const [selectedPlaylistsIds, setSelectedPlaylistsIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('sortTitle')
  const [sortMenuVisible, setSortMenuVisible] = useState(false)

  const [addCurrentSongToPlaylistsModalVisible, setAddCurrentSongToPlaylistsModalVisible] = useState(false)
  const [addingToPlaylists, setAddingToPlaylists] = useState(false)

  // SongActions state
  const [selectedSongForActions, setSelectedSongForActions] = useState<Song | null>(null)
  const [songBeingEdited, setSongBeingEdited] = useState<Song | null>(null);
  const [songActionsVisible, setSongActionsVisible] = useState(false)

  const [editSongModalVisible, setEditSongModalVisible] = useState(false)
  const [editSongTitle, setEditSongTitle] = useState('')
  const [editSongArtist, setEditSongArtist] = useState('')
  const [editSongAlbum, setEditSongAlbum] = useState('')
  const [editSongGenre, setEditSongGenre] = useState('')
  const [editSongYear, setEditSongYear] = useState('')

  const playlist = useMemo(() => {
    if (id === 'all' || id === '0') {
      return {
        id: 'all',
        name: t.library.allSongs,
        songIds: library.songIds,
      } as Playlist
    }
    return playlistsById[id]
  }, [id, playlistsById, library, t])

  const playlistSongs = useMemo(() => {
    if (!playlist) return []
    const songs = playlist.songIds.map((sid) => songsById[sid]).filter(Boolean) as Song[]
    return sortSongs(songs, sortBy)
  }, [playlist, songsById, sortBy])

  const allLibrarySongs = useMemo(() => {
    return Object.values(songsById).sort((a, b) => a.title.localeCompare(b.title))
  }, [songsById])

  const availableToAdd = useMemo(() => {
    if (!playlist) return allLibrarySongs
    return allLibrarySongs.filter((s) => !playlist.songIds.includes(s.id))
  }, [allLibrarySongs, playlist])

  const otherPlaylists = useMemo(() => {
    return Object.values(playlistsById)
      .filter((p) => p.id !== '0' && p.id !== id)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [playlistsById, id])

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return playlistSongs.reduce((sum, song) => sum + song.duration, 0)
  }, [playlistSongs])

  const onPlayAll = useCallback(async () => {
    if (!playlist || playlistSongs.length === 0) return
    try {
      await playList(playlist.songIds, 0)
    } catch {
      notify({ message: t.library.playbackFailed, kind: 'error' })
    }
  }, [playlist, playlistSongs, playList, notify, t])

  const onRemoveSong = useCallback(
    async (songId: string) => {
      await removeSongsFromPlaylist(id, [songId])
      notify({ message: t.playlists.songsRemoved(1), kind: 'success' })
    },
    [id, removeSongsFromPlaylist, notify, t],
  )

  const onPlaySong = useCallback(
    async (songId: string) => {
      if (!playlist) return
      try {
        const idx = playlist.songIds.indexOf(songId)
        await playList(playlist.songIds, idx >= 0 ? idx : 0)
      } catch {
        notify({ message: t.library.playbackFailed, kind: 'error' })
      }
    },
    [playlist, playList, notify, t],
  )

  const onToggleSelect = useCallback((sid: string) => {
    setSelectedSongsIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }, [])

    const onTogglePlaylistSelect = useCallback((pid: string) => {
    setSelectedPlaylistsIds((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid],
    )
  }, [])

  const onConfirmAdd = useCallback(async () => {
    if (selectedSongsIds.length === 0) return
    await addSongsToPlaylist(id, selectedSongsIds)
    notify({ message: t.playlists.songsAdded(selectedSongsIds.length), kind: 'success' })
    setAddSongsToPlaylistModalVisible(false)
    setSelectedSongsIds([])
  }, [id, selectedSongsIds, addSongsToPlaylist, notify, t])

  // SongActions handlers
  const onOpenSongActions = useCallback((song: Song) => {
    setSelectedSongForActions(song)
    setSongActionsVisible(true)
  }, [])

  const onCloseSongActions = useCallback(() => {
    setSongActionsVisible(false)
    setSelectedSongForActions(null)
  }, [])

  const onPlayNext = useCallback(async () => {
    if (!selectedSongForActions) return
    await playNextSongs([selectedSongForActions.id])
    notify({ message: t.songs.addedToPlayNext, kind: 'success' })
  }, [selectedSongForActions, playNextSongs, notify, t])

  const onAddToQueue = useCallback(async () => {
    if (!selectedSongForActions) return
    await addSongsToQueue([selectedSongForActions.id])
    notify({ message: t.songs.addedToQueue, kind: 'success' })
  }, [selectedSongForActions, addSongsToQueue, notify, t])

  const onAddToPlaylist = useCallback(() => {
    if (selectedSongForActions) {
      // Open the "add to other playlists" picker for the selected song
      setSelectedSongsIds([selectedSongForActions.id])
      setAddCurrentSongToPlaylistsModalVisible(true)
      onCloseSongActions()
    }
  }, [selectedSongForActions, onCloseSongActions])

  const onEditSong = useCallback(() => {
    if (!selectedSongForActions) return

    setSongBeingEdited(selectedSongForActions)
    setEditSongTitle(selectedSongForActions.title)
    setEditSongArtist(selectedSongForActions.artist)
    setEditSongAlbum(selectedSongForActions.album ?? '')
    setEditSongGenre(selectedSongForActions.genre ?? '')
    setEditSongYear(selectedSongForActions.year ? String(selectedSongForActions.year) : '')
    setEditSongModalVisible(true)
    setSongActionsVisible(false)
  }, [selectedSongForActions, onCloseSongActions])

  const onConfirmEditSong = useCallback(async () => {
    if (!songBeingEdited) return
  

    const title = editSongTitle.trim()
    const artist = editSongArtist.trim()
    if (!title || !artist) return

    const updates: Partial<Song> = {
      title,
      artist,
      album: editSongAlbum.trim(),
      genre: editSongGenre.trim(),
    }

    const parsedYear = editSongYear.trim()
    if (parsedYear) {
      const yearNumber = Number(parsedYear)
      if (!Number.isNaN(yearNumber)) {
        updates.year = yearNumber
      }
    }

    const updatedSong = await patchSong(songBeingEdited.id, updates)
    if (updatedSong) {
      setSongBeingEdited(null)
    }

    notify({ message: t.songs.editMetadataSuccess, kind: 'success' })
    setEditSongModalVisible(false)
  }, [
    songBeingEdited,
    editSongTitle,
    editSongArtist,
    editSongAlbum,
    editSongGenre,
    editSongYear,
    patchSong,
    notify,
    t,
  ])

  const onConfirmAddToOtherPlaylists = useCallback(async () => {
    if (selectedSongsIds.length === 0 || selectedPlaylistsIds.length === 0) return
    try {
      setAddingToPlaylists(true)
      // Add the selected songs to all chosen playlists in parallel
      await Promise.all(
        selectedPlaylistsIds.map((pid) => addSongsToPlaylist(pid, selectedSongsIds)),
      )
      notify({ message: t.playlists.songsAdded(selectedSongsIds.length), kind: 'success' })
      setAddCurrentSongToPlaylistsModalVisible(false)
      setSelectedPlaylistsIds([])
      setSelectedSongsIds([])
    } catch (err) {
      notify({ message: t.playlists.addToPlaylistFailed, kind: 'error' })
    } finally {
      setAddingToPlaylists(false)
    }
  }, [selectedSongsIds, selectedPlaylistsIds, addSongsToPlaylist, notify, t])

  const onMoveToPlaylist = useCallback(() => {
    notify({ message: 'Move to playlist coming soon', kind: 'info' })
  }, [notify])

  const onRemoveFromPlaylist = useCallback(() => {
    if (selectedSongForActions && id !== 'all' && id !== '0') {
      onRemoveSong(selectedSongForActions.id)
      onCloseSongActions()
    }
  }, [selectedSongForActions, id, onRemoveSong, onCloseSongActions])

  const onDeleteFromLibrary = useCallback(
      () => {
        if (!selectedSongForActions) return
        Alert.alert(t.library.confirmDeleteSong(selectedSongForActions.title), 'This action cannot be undone!', [
          { text: t.playlists.cancel, style: 'cancel' },
          {
            text: t.playlists.delete,
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await deleteSongs([selectedSongForActions.id])
                notify({ message: t.library.songDeleted(selectedSongForActions.title), kind: 'success' })
              })()
            },
          },
        ])
        onCloseSongActions()
      },
      [selectedSongForActions, deleteSongs, notify, t],
    )

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
        { backgroundColor: theme.colors.background},
      ]}
    >

      {/* Playlist actions */}
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

        {/* Add songs */}
        {id !== 'all' && id !== '0' && (
          <Pressable
            onPress={() => {
              setSelectedSongsIds([])
              setAddSongsToPlaylistModalVisible(true)
            }}
            style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.outlineBtnText, { color: theme.colors.text }]}>
              ＋ {t.playlists.addSongs}
            </Text>
          </Pressable>
        )}

        {/* Sort button */}
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
        <View style={[styles.sortMenu, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          {(['sortTitle', 'sortArtist', 'sortDuration', 'sortDateAdded'] as SortOption[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setSortBy(option)
                setSortMenuVisible(false)
              }}
              style={styles.sortMenuItem}
            >
              {/* <Feather
                name={sortBy === option ? 'check' : 'circle'}
                size={16}
                color={sortBy === option ? theme.colors.primary : theme.colors.mutedText}
              /> */}
              <Text
                style={[
                  styles.sortMenuText,
                  {
                    color: sortBy === option ? theme.colors.primary : theme.colors.text,
                    fontWeight: sortBy === option ? '700' : '500',
                  },
                ]}
              >
                {t.songs[option]}
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
            isActive={item.id === playerState.currentSongId}
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

      {/* Add songs to playlist modal */}
      <Modal visible={addSongsToPlaylistModalVisible} animationType="slide" transparent={false}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background, paddingTop: insets.top },
          ]}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setAddSongsToPlaylistModalVisible(false)} hitSlop={15}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>
                {t.playlists.cancel}
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t.playlists.addSongs}
            </Text>
            <Pressable onPress={onConfirmAdd} disabled={selectedSongsIds.length === 0} hitSlop={15}>
              <Text
                style={[
                  styles.modalConfirm,
                  {
                    color: theme.colors.primary,
                    opacity: selectedSongsIds.length === 0 ? 0.4 : 1,
                  },
                ]}
              >
                {t.playlists.addSongs} ({selectedSongsIds.length})
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={availableToAdd}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SelectionRow
                item={item}
                isSelected={selectedSongsIds.includes(item.id)}
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
        canDelete={true}
        onPlayNext={onPlayNext}
        onAddToQueue={onAddToQueue}
        onEditSong={onEditSong}
        onAddToPlaylist={onAddToPlaylist}
        onMoveToPlaylist={onMoveToPlaylist}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
        onDeleteFromLibrary={onDeleteFromLibrary}
      />

      <Modal visible={editSongModalVisible} animationType="slide" transparent={false}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background, paddingTop: insets.top },
          ]}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditSongModalVisible(false)} hitSlop={15}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}> 
                {t.playlists.cancel}
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t.songs.editMetadata}
            </Text>
            <Pressable
              onPress={onConfirmEditSong}
              disabled={!editSongTitle.trim() || !editSongArtist.trim()}
              hitSlop={15}
            >
              <Text
                style={[
                  styles.modalConfirm,
                  {
                    color: theme.colors.primary,
                    opacity: !editSongTitle.trim() || !editSongArtist.trim() ? 0.4 : 1,
                  },
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>

          <View style={styles.editForm}>
            <Text style={[styles.inputLabel, { color: theme.colors.mutedText }]}>Title</Text>
            <TextInput
              value={editSongTitle}
              onChangeText={setEditSongTitle}
              style={[styles.inputField, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Title"
              placeholderTextColor={theme.colors.mutedText}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.mutedText }]}>Artist</Text>
            <TextInput
              value={editSongArtist}
              onChangeText={setEditSongArtist}
              style={[styles.inputField, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Artist"
              placeholderTextColor={theme.colors.mutedText}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.mutedText }]}>Album</Text>
            <TextInput
              value={editSongAlbum}
              onChangeText={setEditSongAlbum}
              style={[styles.inputField, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Album"
              placeholderTextColor={theme.colors.mutedText}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.mutedText }]}>Genre</Text>
            <TextInput
              value={editSongGenre}
              onChangeText={setEditSongGenre}
              style={[styles.inputField, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Genre"
              placeholderTextColor={theme.colors.mutedText}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.mutedText }]}>Year</Text>
            <TextInput
              value={editSongYear}
              onChangeText={setEditSongYear}
              style={[styles.inputField, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Year"
              placeholderTextColor={theme.colors.mutedText}
              keyboardType="numeric"
            />
          </View>
        </View>
      </Modal>
      
      {/* Add current song to playlists modal */}
      <Modal
        visible={addCurrentSongToPlaylistsModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background, paddingTop: insets.top },
          ]}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setAddCurrentSongToPlaylistsModalVisible(false)} hitSlop={15}>
              <Text style={[styles.modalClose, { color: theme.colors.text }]}>
                {t.playlists.cancel}
              </Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t.playlists.addToOtherPlaylist}
            </Text>
            <Pressable
              onPress={onConfirmAddToOtherPlaylists}
              disabled={selectedPlaylistsIds.length === 0 || addingToPlaylists}
              hitSlop={15}
            >
              <Text
                style={[
                  styles.modalConfirm,
                  {
                    color: theme.colors.primary,
                    opacity: selectedPlaylistsIds.length === 0 || addingToPlaylists ? 0.4 : 1,
                  },
                ]}
              >
                {t.playlists.addShortened} ({selectedPlaylistsIds.length})
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={otherPlaylists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PlaylistTargetRow
                item={item}
                isSelected={selectedPlaylistsIds.includes(item.id)}
                onSelect={onTogglePlaylistSelect}
                colors={theme.colors}
                chooseLabel={t.playlists.choose}
              />
            )}
            contentContainerStyle={[styles.modalListContent, { paddingBottom: insets.bottom + 20 }]}
          />
        </View>
      </Modal>

      {/* Delete song modal */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginTop: 0,
  },
  subtitle: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 48,
    paddingBottom: 12,
    gap: 12,
    alignItems: 'center',
  },
  mainBtn: {
    flex: 1.5,
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
    alignSelf: 'flex-end', // => Container will shrink to fit the content
    position: 'absolute',
    top: 60,
    zIndex: 1000,
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
  editForm: {
    padding: 20,
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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