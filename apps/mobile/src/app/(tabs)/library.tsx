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

import type { Playlist, Song } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { useLibrary } from '../../application'
import { usePlayerState } from '../../application/player'
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
        <Text
          numberOfLines={1}
          style={[styles.rowTitle, { color: isActive ? colors.primary : colors.text }]}
        >
          {item.title}
        </Text>
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
    isHydrated,
    songsById,
    library,
    playlistsById,
    importPickedAudio,
    deleteSongs,
    addSongsToPlaylist,
  } = useLibrary()
  const { playList, state: playerState } = usePlayerState()
  const { registerImportHandler } = useAppShell()

  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [playlistModalVisible, setPlaylistModalVisible] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)

  const songs = useMemo(() => {
    const list = library.songIds.map((id) => songsById[id]).filter(Boolean) as Song[]
    if (!sortField) return list
    return [...list].sort((a, b) => compareSongs(a, b, sortField, sortDir))
  }, [library.songIds, songsById, sortField, sortDir])

  const sortedIds = useMemo(() => songs.map((s) => s.id), [songs])

  const playlists = useMemo(() => {
    return Object.values(playlistsById)
      .filter((p) => p.id !== '0')
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [playlistsById])

  const songCount = songs.length
  const colors = theme.colors

  const pickAudioFiles = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: false,
    })

    if (result.canceled) {
      notify({ message: t.library.importCanceled, kind: 'info' })
      return
    }

    try {
      const { imported, skippedDuplicates } = await importPickedAudio(result.assets)
      notify({
        message:
          skippedDuplicates > 0
            ? t.library.importSuccessWithSkipped(imported, skippedDuplicates)
            : t.library.importSuccess(imported),
        kind: 'success',
      })
    } catch {
      notify({ message: t.library.importFailed, kind: 'error' })
    }
  }, [importPickedAudio, notify, t])

  useEffect(() => {
    registerImportHandler(pickAudioFiles)
    return () => registerImportHandler(null)
  }, [registerImportHandler, pickAudioFiles])

  const onLongPressSong = useCallback(
    (songId: string, title: string) => {
      Alert.alert(t.library.confirmDeleteSong(title), '', [
        { text: t.playlists.cancel, style: 'cancel' },
        {
          text: t.playlists.delete,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteSongs([songId])
              notify({ message: t.library.songDeleted(title), kind: 'success' })
            })()
          },
        },
      ])
    },
    [deleteSongs, notify, t],
  )

  const onPressSong = useCallback(
    (songId: string) => {
      void (async () => {
        try {
          const idx = sortedIds.indexOf(songId)
          await playList(sortedIds, idx >= 0 ? idx : 0)
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
    [playList, sortedIds, notify, t],
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

      await addSongsToPlaylist(playlistId, [selectedSong.id])
      notify({
        message: `"${selectedSong.title}" đã được thêm vào playlist`,
        kind: 'success',
      })
      onClosePlaylistModal()
    },
    [addSongsToPlaylist, notify, onClosePlaylistModal, selectedSong],
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
        isActive={item.id === playerState.currentSongId}
        onPress={onPressSong}
        onLongPress={onLongPressSong}
        onAddToPlaylist={onOpenAddToPlaylist}
        colors={colors}
      />
    ),
    [playerState.currentSongId, onPressSong, onLongPressSong, onOpenAddToPlaylist, colors],
  )

  const keyExtractor = useCallback((item: Song) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t.library.title}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        {isHydrated ? `${songCount} songs` : t.common.loadingPreference}
      </Text>

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
        style={styles.list}
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
          isHydrated ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎶</Text>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                No songs yet — tap Import to add music
              </Text>
            </View>
          ) : null
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
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Thêm vào playlist
            </Text>

            {selectedSong ? (
              <Text style={[styles.modalSubtitle, { color: colors.mutedText }]} numberOfLines={2}>
                Bài hát: {selectedSong.title}
              </Text>
            ) : null}

            {playlists.length === 0 ? (
              <View style={styles.modalEmptyWrap}>
                <Text style={[styles.modalEmptyText, { color: colors.mutedText }]}>
                  Chưa có playlist nào. Hãy tạo playlist trước ở mục Playlists.
                </Text>
              </View>
            ) : (
              <FlatList
                data={playlists}
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
    padding: 24,
    paddingBottom: 110,
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
    flex: 1,
  },
  listContent: {
    gap: ROW_GAP,
    paddingBottom: 24,
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
    gap: 12,
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