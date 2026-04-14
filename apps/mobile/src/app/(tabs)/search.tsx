import { router } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import type { Playlist, RecentSearch, Song } from '@music/types'

import { useTheme } from '../../theme'
import { useLanguage } from '../../i18n'
import { useNotifications } from '../../notifications'
import { useLibrary } from '../../application'
import { usePlayerState } from '../../application/player'

// ── Search Result Rows ──────────────────────────────────────────

const SongResultRow = React.memo(function SongResultRow({
  item,
  onPress,
  colors,
}: {
  item: Song
  onPress: (id: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
}) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>🎵</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.mutedText }]}>
          {item.artist}{item.album ? ` · ${item.album}` : ''}
        </Text>
      </View>
    </Pressable>
  )
})

const PlaylistResultRow = React.memo(function PlaylistResultRow({
  item,
  onPress,
  colors,
}: {
  item: Playlist
  onPress: (id: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string }
}) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
        <Text style={styles.rowIconText}>🎶</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: colors.mutedText }]}>
          {item.songIds.length} songs
        </Text>
      </View>
    </Pressable>
  )
})

const RecentSearchRow = React.memo(function RecentSearchRow({
  item,
  onPress,
  onRemove,
  colors,
}: {
  item: RecentSearch
  onPress: (text: string) => void
  onRemove: (text: string) => void
  colors: { text: string; mutedText: string }
}) {
  if (item.type !== 'query') return null
  return (
    <View style={styles.recentRow}>
      <Pressable onPress={() => onPress(item.text)} style={styles.recentTextBtn}>
        <Text style={styles.recentIcon}>🕒</Text>
        <Text numberOfLines={1} style={[styles.recentText, { color: colors.text }]}>
          {item.text}
        </Text>
      </Pressable>
      <Pressable onPress={() => onRemove(item.text)} style={styles.removeBtn} hitSlop={10}>
        <Text style={[styles.removeIcon, { color: colors.mutedText }]}>✕</Text>
      </Pressable>
    </View>
  )
})

// ── Main Screen ─────────────────────────────────────────────────

export default function SearchScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const { 
    songsById, 
    playlistsById, 
    recentSearches, 
    addRecentSearch, 
    removeRecentSearch, 
    clearRecentSearches 
  } = useLibrary()
  const { playFromQueue } = usePlayerState()

  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim().toLowerCase()

  // ── Handlers ────────────────────────────────────

  const onPlaySong = useCallback(
    async (songId: string) => {
      if (query.trim()) {
        void addRecentSearch(query)
      }
      const res = await playFromQueue([songId], songId)
      if (!res.ok) {
        notify({ message: t.library.playbackFailed, kind: 'error' })
      }
    },
    [playFromQueue, notify, t, query, addRecentSearch],
  )

  const onOpenPlaylist = useCallback((id: string) => {
    if (query.trim()) {
      void addRecentSearch(query)
    }
    router.push({ pathname: '/playlist/[id]', params: { id } })
  }, [query, addRecentSearch])

  const onClear = useCallback(() => setQuery(''), [])

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      void addRecentSearch(query)
    }
  }, [query, addRecentSearch])

  // ── Filter logic ────────────────────────────────

  const results = useMemo(() => {
    if (!trimmedQuery) return []

    const filteredSongs = Object.values(songsById).filter(
      (s) =>
        s.title.toLowerCase().includes(trimmedQuery) ||
        s.artist.toLowerCase().includes(trimmedQuery) ||
        (s.album && s.album.toLowerCase().includes(trimmedQuery)),
    )

    const filteredPlaylists = Object.values(playlistsById).filter(
      (p) => p.name.toLowerCase().includes(trimmedQuery) && p.id !== '0',
    )

    const sections = []
    if (filteredSongs.length > 0) {
      sections.push({ title: t.search.songs, data: filteredSongs, type: 'song' as const })
    }
    if (filteredPlaylists.length > 0) {
      sections.push({ title: t.search.playlists, data: filteredPlaylists, type: 'playlist' as const })
    }

    return sections
  }, [trimmedQuery, songsById, playlistsById, t])

  // ── Render ──────────────────────────────────────

  const colors = theme.colors

  const renderResultItem = useCallback(
    ({ item, section }: { item: any; section: any }) => {
      if (section.type === 'song') {
        return <SongResultRow item={item} onPress={onPlaySong} colors={colors} />
      }
      return <PlaylistResultRow item={item} onPress={onOpenPlaylist} colors={colors} />
    },
    [onPlaySong, onOpenPlaylist, colors],
  )

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>{title}</Text>
      </View>
    ),
    [theme.colors.background, theme.colors.primary],
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder={t.search.placeholder}
          placeholderTextColor={theme.colors.mutedText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          autoFocus
          autoCapitalize="none"
          clearButtonMode="always"
        />
        {query.length > 0 && (
          <Pressable onPress={onClear} style={styles.clearBtn}>
            <Text style={[styles.clearBtnText, { color: theme.colors.mutedText }]}>{t.search.clear}</Text>
          </Pressable>
        )}
      </View>

      {/* Conditional Content */}
      {trimmedQuery === '' ? (
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionHeaderText, { color: theme.colors.primary }]}>
                  {t.search.recentSearches}
                </Text>
                <Pressable onPress={clearRecentSearches}>
                  <Text style={[styles.clearAllText, { color: theme.colors.mutedText }]}>
                    {t.search.clearAll}
                  </Text>
                </Pressable>
              </View>
              <FlatList
                data={recentSearches}
                keyExtractor={(item, index) => `${item.type}-${index}`}
                renderItem={({ item }) => (
                  <RecentSearchRow
                    item={item}
                    onPress={setQuery}
                    onRemove={removeRecentSearch}
                    colors={colors}
                  />
                )}
                contentContainerStyle={styles.recentList}
              />
            </>
          )}
        </View>
      ) : (
        <SectionList
          sections={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            trimmedQuery.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>😕</Text>
                <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
                  {t.search.noResults}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 10,
  },
  sectionHeader: {
    paddingVertical: 10,
    marginTop: 4,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000008',
  },
  rowIconText: {
    fontSize: 18,
  },
  rowInfo: {
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentList: {
    gap: 4,
    paddingBottom: 110,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  recentTextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  recentText: {
    fontSize: 15,
    fontWeight: '500',
  },
  removeBtn: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
})
