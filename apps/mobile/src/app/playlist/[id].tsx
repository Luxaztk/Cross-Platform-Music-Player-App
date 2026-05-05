import { useLocalSearchParams } from 'expo-router'
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

import type { Playlist, Song } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { useLibrary } from '../../application'
import { usePlayer } from '../../application/player'

// ── Song row for playlist ───────────────────────────────────────

const PlaylistSongRow = React.memo(function PlaylistSongRow({
  item,
  isActive,
  onPress,
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
  onAddToOtherPlaylist,
  onMoveToOtherPlaylist,
  onRemove,
  colors,
  t,
}: {
  item: Song
  isActive: boolean
  onPress: (id: string) => void
  isMenuOpen: boolean
  onOpenMenu: (song: Song) => void
  onCloseMenu: () => void
  onAddToOtherPlaylist: (song: Song) => void
  onMoveToOtherPlaylist: (song: Song) => void
  onRemove: (id: string) => void
  colors: {
    surface: string
    border: string
    text: string
    mutedText: string
    primary: string
    background: string
  }
  t: {
    addToOtherPlaylist: string
    moveToOtherPlaylist: string
    removeFromThisPlaylist: string
  }
}) {
  return (
    <View style={styles.rowWrap}>
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
          <Text
            numberOfLines={1}
            style={[styles.rowTitle, { color: isActive ? colors.primary : colors.text }]}
          >
            {item.title}
          </Text>
          <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.mutedText }]}>
            {item.artist}
          </Text>
        </Pressable>

        <Pressable onPress={() => onOpenMenu(item)} hitSlop={10} style={styles.moreBtn}>
          <Text style={[styles.moreIcon, { color: colors.mutedText }]}>⋯</Text>
        </Pressable>
      </View>

      {isMenuOpen && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={onCloseMenu} />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onCloseMenu()
                onAddToOtherPlaylist(item)
              }}
            >
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t.addToOtherPlaylist}
              </Text>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onCloseMenu()
                onMoveToOtherPlaylist(item)
              }}
            >
              <Text style={[styles.menuText, { color: colors.text }]}>
                {t.moveToOtherPlaylist}
              </Text>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onCloseMenu()
                onRemove(item.id)
              }}
            >
              <Text style={[styles.menuText, { color: '#FF5A5F' }]}>
                {t.removeFromThisPlaylist}
              </Text>
            </Pressable>
          </View>
        </>
      )}
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
    playlistsById,
    songsById,
    addSongsToPlaylist,
    removeSongsFromPlaylist,
  } = useLibrary()
  const { playList, state: playerState } = usePlayer()

  const [addModalVisible, setAddModalVisible] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [openedMenuSongId, setOpenedMenuSongId] = useState<string | null>(null)
  const [targetSong, setTargetSong] = useState<Song | null>(null)
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false)
  const [actionMode, setActionMode] = useState<'add' | 'move' | null>(null)

  const playlist = playlistsById[id]

  const playlistSongs = useMemo(() => {
    if (!playlist) return []
    return playlist.songIds.map((sid) => songsById[sid]).filter(Boolean) as Song[]
  }, [playlist, songsById])

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
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }, [])

  const onConfirmAdd = useCallback(async () => {
    if (selectedIds.length === 0) return
    await addSongsToPlaylist(id, selectedIds)
    notify({ message: t.playlists.songsAdded(selectedIds.length), kind: 'success' })
    setAddModalVisible(false)
    setSelectedIds([])
  }, [id, selectedIds, addSongsToPlaylist, notify, t])

  const onOpenMenu = useCallback((song: Song) => {
    setOpenedMenuSongId(song.id)
  }, [])

  const onCloseMenu = useCallback(() => {
    setOpenedMenuSongId(null)
  }, [])

  const onAddToOtherPlaylist = useCallback((song: Song) => {
    setTargetSong(song)
    setActionMode('add')
    setPlaylistPickerVisible(true)
  }, [])

  const onMoveToOtherPlaylist = useCallback((song: Song) => {
    setTargetSong(song)
    setActionMode('move')
    setPlaylistPickerVisible(true)
  }, [])

  const onClosePlaylistPicker = useCallback(() => {
    setTargetSong(null)
    setActionMode(null)
    setPlaylistPickerVisible(false)
  }, [])

  const onSelectTargetPlaylist = useCallback(
    async (targetPlaylistId: string) => {
      if (!targetSong || !actionMode) return

      await addSongsToPlaylist(targetPlaylistId, [targetSong.id])

      if (actionMode === 'move') {
        await removeSongsFromPlaylist(id, [targetSong.id])
        notify({
          message: t.playlists.songMovedToOtherPlaylist(targetSong.title),
          kind: 'success',
        })
      } else {
        notify({
          message: t.playlists.songAddedToOtherPlaylist(targetSong.title),
          kind: 'success',
        })
      }

      onClosePlaylistPicker()
    },
    [targetSong, actionMode, addSongsToPlaylist, removeSongsFromPlaylist, id, notify, onClosePlaylistPicker, t],
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
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            {t.playlists.songCount(playlistSongs.length)}
          </Text>
        </View>
      </View>

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
      </View>

      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaylistSongRow
            item={item}
            isActive={item.id === playerState.currentSongId}
            onPress={onPlaySong}
            isMenuOpen={openedMenuSongId === item.id}
            onOpenMenu={onOpenMenu}
            onCloseMenu={onCloseMenu}
            onAddToOtherPlaylist={onAddToOtherPlaylist}
            onMoveToOtherPlaylist={onMoveToOtherPlaylist}
            onRemove={onRemoveSong}
            colors={theme.colors}
            t={{
              addToOtherPlaylist: t.playlists.addToOtherPlaylist,
              moveToOtherPlaylist: t.playlists.moveToOtherPlaylist,
              removeFromThisPlaylist: t.playlists.removeFromThisPlaylist,
            }}
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

      <Modal
        visible={playlistPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={onClosePlaylistPicker}
      >
        <Pressable style={styles.overlay} onPress={onClosePlaylistPicker}>
          <Pressable
            style={[
              styles.pickerCard,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
              {actionMode === 'move'
                ? t.playlists.moveToOtherPlaylist
                : t.playlists.addToOtherPlaylist}
            </Text>

            {targetSong ? (
              <Text style={[styles.pickerSubtitle, { color: theme.colors.mutedText }]}>
                {t.playlists.songLabel}: {targetSong.title}
              </Text>
            ) : null}

            {otherPlaylists.length === 0 ? (
              <View style={styles.emptyPickerWrap}>
                <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
                  {t.playlists.noOtherPlaylists}
                </Text>
              </View>
            ) : (
              <FlatList
                data={otherPlaylists}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalListContent}
                renderItem={({ item }) => (
                  <PlaylistTargetRow
                    item={item}
                    onSelect={onSelectTargetPlaylist}
                    colors={theme.colors}
                    chooseLabel={t.playlists.choose}
                  />
                )}
              />
            )}

            <Pressable
              onPress={onClosePlaylistPicker}
              style={[styles.closeBtn, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: theme.colors.text }]}>
                {t.playlists.close}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
  rowWrap: {
    position: 'relative',
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
  moreBtn: {
    padding: 8,
  },
  moreIcon: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  menu: {
    position: 'absolute',
    top: 54,
    right: 8,
    minWidth: 220,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 10,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
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