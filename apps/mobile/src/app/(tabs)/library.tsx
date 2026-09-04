import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet, 
  Text,
  View,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

import Feather from '@expo/vector-icons/Feather'
 
import type { Playlist, Song } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { useLibraryContext, usePlayer } from '@music/hooks'
import { useAppShell } from '../../presentations/components/AppShell'

type SortField = 'title' | 'artist' | 'album' | 'dateAdded'
type SortDir = 'asc' | 'desc'

function compareSongs(a: Song, b: Song, field: SortField, dir: SortDir): number {
  const aVal = (a[field] ?? '').toString().toLowerCase()
  const bVal = (b[field] ?? '').toString().toLowerCase()
  const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
  return dir === 'asc' ? cmp : -cmp
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SongRow = React.memo(function SongRow({
  item,
  isActive,
  onPress,
  onLongPress,
  onAddToPlaylist,
  colors,
}: {
  item: Song
  isActive: boolean
  onPress: (id: string) => void
  onLongPress: (id: string, title: string) => void
  onAddToPlaylist: (song: Song) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
}) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      onLongPress={() => onLongPress(item.id, item.title)}
      style={[
        styles.row,
        {
          backgroundColor: isActive ? colors.primary + '18' : colors.surface,
          borderColor: isActive ? colors.primary + '44' : colors.border,
        },
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            numberOfLines={1}
            style={[styles.rowTitle, { color: isActive ? colors.primary : colors.text, flexShrink: 1 }]}
          >
            {item.title}
          </Text>
          {item.isOffline ? (
            <View
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderWidth: 1,
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Feather name="check-circle" size={9} color="#3B82F6" />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: '#3B82F6',
                  letterSpacing: 0.5,
                }}
              >
                OFFLINE
              </Text>
            </View>
          ) : item.sourceType === 'stream' ? (
            <View
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                borderWidth: 1,
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: colors.primary,
                  letterSpacing: 0.5,
                }}
              >
                STREAM
              </Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.mutedText }]}>
          {item.artist}
          {item.album ? ` · ${item.album}` : ''}
        </Text>
      </View>

      {item.duration > 0 && (
        <Text style={[styles.rowDuration, { color: colors.mutedText }]}>
          {formatDuration(item.duration)}
        </Text>
      )}

      <Pressable
        onPress={(e) => {
          e.stopPropagation()
          onAddToPlaylist(item)
        }}
        hitSlop={10}
        style={[
          styles.addBtn,
          {
            borderColor: colors.border,
            backgroundColor: colors.primary + '14',
          },
        ]}
      >
        <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Playlist</Text>
      </Pressable>
    </Pressable>
  )
})

const PlaylistPickRow = React.memo(function PlaylistPickRow({
  item,
  onSelect,
  colors,
}: {
  item: Playlist
  onSelect: (playlistId: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
}) {
  return (
    <Pressable
      onPress={() => onSelect(item.id)}
      style={[
        styles.playlistRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.playlistInfo}>
        <Text numberOfLines={1} style={[styles.playlistName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.playlistCount, { color: colors.mutedText }]}>
          {item.songIds.length} bài hát
        </Text>
      </View>

      <Text style={[styles.playlistChoose, { color: colors.primary }]}>Chọn</Text>
    </Pressable>
  )
})

export default function LibraryScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const {
    songs: songsArray,
    library,
    playlists,
    handleImportFiles,
    handleDeleteSong,
    handleAddSongsToPlaylist
  } = useLibraryContext()
  const { playList, currentSong, isPlaying } = usePlayer()
  const { registerImportHandler } = useAppShell()

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)

  const songs = useMemo(() => {
    const list = songsArray;
    if (!sortField) return list
    return [...list].sort((a, b) => compareSongs(a, b, sortField, sortDir))
  }, [songsArray, sortField, sortDir])

  const sortedSongs = useMemo(() => songs, [songs])

  const playlistsList = useMemo(() => {
    return playlists
      .filter((p) => p.id !== '0')
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [playlists])

  const songCount = songs.length
  const colors = theme.colors

  const pickAudioFiles = useCallback(async () => {
    try {
      if (handleImportFiles) {
        await handleImportFiles();
        notify({ message: 'Đã nhập bài hát', kind: 'success' })
      }
    } catch {
      notify({ message: t.library.importFailed, kind: 'error' })
    }
  }, [handleImportFiles, notify, t])

  // useEffect(() => {
  //   registerImportHandler(pickAudioFiles)
  //   return () => registerImportHandler(null)
  // }, [registerImportHandler, pickAudioFiles])

  const onLongPressSong = useCallback(
    (songId: string, title: string) => {
      Alert.alert(t.library.confirmDeleteSong(title), '', [
        { text: t.playlists.cancel, style: 'cancel' },
        {
          text: t.playlists.delete,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (handleDeleteSong) {
                await handleDeleteSong(songId)
                notify({ message: t.library.songDeleted(title), kind: 'success' })
              }
            })()
          },
        },
      ])
    },
    [handleDeleteSong, notify, t],
  )

  const onPressSong = useCallback(
    (songId: string) => {
      void (async () => {
        try {
          const idx = sortedSongs.findIndex(s => s.id === songId)
          playList(sortedSongs, idx >= 0 ? idx : 0)
        } catch (err: any) {
          notify({
            message:
              err?.message === 'AUDIO_MODULE_UNAVAILABLE'
                ? t.library.playbackUnavailable
                : t.library.playbackFailed,
            kind: 'error',
          })
        }
      })()
    },
    [playList, sortedSongs, notify, t],
  )

  const onOpenAddToPlaylist = useCallback(
    (song: Song) => {
      setSelectedSong(song)
      setPlaylistModalVisible(true)
    },
    [],
  )

  const onClosePlaylistModal = useCallback(() => {
    setSelectedSong(null)
    setPlaylistModalVisible(false)
  }, [])

  const onSelectPlaylist = useCallback(
    async (playlistId: string) => {
      if (!selectedSong) return

      if (handleAddSongsToPlaylist) {
        await handleAddSongsToPlaylist(playlistId, [selectedSong.id])
        notify({
          message: `"${selectedSong.title}" đã được thêm vào playlist`,
          kind: 'success',
        })
      }
      onClosePlaylistModal()
    },
    [handleAddSongsToPlaylist, notify, onClosePlaylistModal, selectedSong],
  )

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        if (sortDir === 'asc') {
          setSortDir('desc')
        } else {
          setSortField(null)
          setSortDir('asc')
        }
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField, sortDir],
  )

  const sortArrow = sortDir === 'asc' ? ' ↑' : ' ↓'

  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongRow
        item={item}
        isActive={item.id === currentSong?.id}
        onPress={onPressSong}
        onLongPress={onLongPressSong}
        onAddToPlaylist={onOpenAddToPlaylist}
        colors={colors}
      />
    ),
    [currentSong?.id, onPressSong, onLongPressSong, onOpenAddToPlaylist, colors],
  )

  const keyExtractor = useCallback((item: Song) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.libraryHeaderRow}>
        <View style={styles.libraryTitleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{t.library.title}</Text>

          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {`${songCount} songs`}
          </Text>
        </View>
      </View>

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: colors.mutedText }]}>Sort:</Text>

        <Pressable
          onPress={() => setSortField(null)}
          style={[
            styles.sortChip,
            {
              backgroundColor: !sortField ? colors.primary + '20' : colors.surface,
              borderColor: !sortField ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sortChipText,
              { color: !sortField ? colors.primary : colors.mutedText },
            ]}
          >
            Default
          </Text>
        </Pressable>

        {(['title', 'artist', 'album', 'dateAdded'] as const).map((field) => {
          const active = sortField === field
          const label =
            field === 'dateAdded'
              ? 'Date Added'
              : field.charAt(0).toUpperCase() + field.slice(1)

          return (
            <Pressable
              key={field}
              onPress={() => toggleSort(field)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: active ? colors.primary + '20' : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: active ? colors.primary : colors.mutedText },
                ]}
              >
                {label}
                {active ? sortArrow : ''}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <FlatList
        style={[styles.list]}
        data={songs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews={true}
        getItemLayout={(_data, index) => ({
          length: ROW_HEIGHT + ROW_GAP,
          offset: (ROW_HEIGHT + ROW_GAP) * index,
          index,
        })}
        ListEmptyComponent={
          (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎶</Text>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                No songs yet — tap Import to add music
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={playlistModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onClosePlaylistModal}
      >
        <Pressable style={styles.modalOverlay} onPress={onClosePlaylistModal}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => { }}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Thêm vào playlist
            </Text>

            {selectedSong ? (
              <Text style={[styles.modalSubtitle, { color: colors.mutedText }]} numberOfLines={2}>
                Bài hát: {selectedSong.title}
              </Text>
            ) : null}

            {playlistsList.length === 0 ? (
              <View style={styles.modalEmptyWrap}>
                <Text style={[styles.modalEmptyText, { color: colors.mutedText }]}>
                  Chưa có playlist nào. Hãy tạo playlist trước ở mục Playlists.
                </Text>
              </View>
            ) : (
              <FlatList
                data={playlistsList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalListContent}
                renderItem={({ item }) => (
                  <PlaylistPickRow
                    item={item}
                    onSelect={onSelectPlaylist}
                    colors={colors}
                  />
                )}
              />
            )}

            <Pressable
              onPress={onClosePlaylistModal}
              style={[styles.closeBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.text }]}>Đóng</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const ROW_HEIGHT = 64
const ROW_GAP = 8

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  libraryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
  },

  libraryTitleBlock: {
    flex: 1,
    minWidth: 0,
  },

  uploadBtn: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  uploadBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.8,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    marginTop: 14,
    flex: 1
  },
  listContent: {
    gap: ROW_GAP,
    paddingBottom: 100
  },
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  rowLeft: {
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
  rowDuration: {
    fontSize: 12,
    marginLeft: 6,
  },
  addBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    maxHeight: '75%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  modalEmptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalListContent: {
    paddingTop: 14,
    gap: 10,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12
  },
  playlistInfo: {
    flex: 1,
    gap: 3,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: '700',
  },
  playlistCount: {
    fontSize: 12,
  },
  playlistChoose: {
    fontSize: 13,
    fontWeight: '800',
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