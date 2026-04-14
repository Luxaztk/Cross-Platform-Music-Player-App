import React, { useCallback, useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

import type { Song } from '@music/types'

import { useTheme } from '../../theme'
import { useLanguage } from '../../i18n'
import { useNotifications } from '../../notifications'
import { useLibrary } from '../../application'
import { usePlayerState } from '../../application/player'

// ── Sort helpers ────────────────────────────────────────────────

type SortField = 'title' | 'artist' | 'album'
type SortDir = 'asc' | 'desc'

function compareSongs(a: Song, b: Song, field: SortField, dir: SortDir): number {
  const aVal = (a[field] ?? '').toLowerCase()
  const bVal = (b[field] ?? '').toLowerCase()
  const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
  return dir === 'asc' ? cmp : -cmp
}

// ── Song row (pure component for FlatList perf) ─────────────────

const SongRow = React.memo(function SongRow({
  item,
  isActive,
  onPress,
  onLongPress,
  colors,
}: {
  item: Song
  isActive: boolean
  onPress: (id: string) => void
  onLongPress: (id: string, title: string) => void
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
        <Text numberOfLines={1} style={[styles.rowTitle, { color: isActive ? colors.primary : colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.mutedText }]}>
          {item.artist}{item.album ? ` · ${item.album}` : ''}
        </Text>
      </View>
      {item.duration > 0 && (
        <Text style={[styles.rowDuration, { color: colors.mutedText }]}>
          {formatDuration(item.duration)}
        </Text>
      )}
    </Pressable>
  )
})

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Main screen ─────────────────────────────────────────────────

export default function LibraryScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const { isHydrated, songsById, library, importPickedAudio, deleteSongs } = useLibrary()
  const { playFromQueue, state: playerState } = usePlayerState()

  const [sortField, setSortField] = useState<SortField>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Build sorted song list (memoised so FlatList doesn't re-render on unrelated changes)
  const songs = useMemo(() => {
    const list = library.songIds.map((id) => songsById[id]).filter(Boolean) as Song[]
    return list.sort((a, b) => compareSongs(a, b, sortField, sortDir))
  }, [library.songIds, songsById, sortField, sortDir])

  // Pre-compute sorted IDs so queue order matches what's on screen
  const sortedIds = useMemo(() => songs.map((s) => s.id), [songs])

  const songCount = songs.length

  // ── Import handler ──────────────────────────────

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
        const res = await playFromQueue(sortedIds, songId)
        if (!res.ok) {
          notify({
            message:
              res.error === 'AUDIO_MODULE_UNAVAILABLE'
                ? t.library.playbackUnavailable
                : t.library.playbackFailed,
            kind: 'error',
          })
        }
      })()
    },
    [playFromQueue, sortedIds, notify, t],
  )

  // ── Sort toggle ─────────────────────────────────

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
    },
    [sortField],
  )

  const sortArrow = sortDir === 'asc' ? ' ↑' : ' ↓'

  // ── Render ──────────────────────────────────────

  const colors = theme.colors

  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongRow
        item={item}
        isActive={item.id === playerState.currentSongId}
        onPress={onPressSong}
        onLongPress={onLongPressSong}
        colors={colors}
      />
    ),
    [playerState.currentSongId, onPressSong, onLongPressSong, colors],
  )

  const keyExtractor = useCallback((item: Song) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Text style={[styles.title, { color: theme.colors.text }]}>{t.library.title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        {isHydrated ? `${songCount} songs` : t.common.loadingPreference}
      </Text>

      {/* Actions row */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={pickAudioFiles}
          style={[styles.importBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.importBtnText}>{t.library.importSongs}</Text>
        </Pressable>
      </View>

      {/* Sort chips */}
      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.colors.mutedText }]}>Sort:</Text>
        {(['title', 'artist', 'album'] as const).map((field) => {
          const active = sortField === field
          return (
            <Pressable
              key={field}
              onPress={() => toggleSort(field)}
              style={[
                styles.sortChip,
                {
                  backgroundColor: active ? theme.colors.primary + '20' : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: active ? theme.colors.primary : theme.colors.mutedText },
                ]}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {active ? sortArrow : ''}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Song list */}
      <FlatList
        style={styles.list}
        data={songs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        // Performance: batch render & window sizing for 200+ songs
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
              <Text style={[styles.emptyEmoji]}>🎶</Text>
              <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
                No songs yet — tap Import to add music
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

// ── Constants for getItemLayout ─────────────────────────────────

const ROW_HEIGHT = 58
const ROW_GAP = 8

// ── Styles ──────────────────────────────────────────────────────

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
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  importBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  importBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
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
    marginLeft: 10,
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
})
