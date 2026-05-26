import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { useLibrary } from '../../application'
import { PlaylistRow } from '../../presentations/components/PlaylistRow'
import { PlaylistActions } from '../../presentations/components/PlaylistActions'
import { NameModal } from '../../presentations/components/NameModal'

export default function LibraryScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const {
    isHydrated,
    library,
    playlistsById,
    renamePlaylist,
    deletePlaylist,
  } = useLibrary()

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [isActionsVisible, setIsActionsVisible] = useState(false)
  const [isRenameVisible, setIsRenameVisible] = useState(false)

  const sortedPlaylists = useMemo(() => {
    return Object.values(playlistsById)
      .filter((p) => p.id !== '0')
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }, [playlistsById])

  const playlists = useMemo(() => {
    const allSongs = {
      id: 'all',
      name: t.library.allSongs,
      songIds: library.songIds,
      isSpecial: true,
    }
    return [allSongs, ...sortedPlaylists]
  }, [library.songIds, sortedPlaylists, t])

  const selectedPlaylist = useMemo(() => {
    if (!selectedPlaylistId) return null
    if (selectedPlaylistId === 'all') return playlists[0]
    return playlistsById[selectedPlaylistId]
  }, [selectedPlaylistId, playlists, playlistsById])

  const handlePress = useCallback((id: string) => {
    router.push({ pathname: '/playlist/[id]', params: { id } })
  }, [])

  const handleMore = useCallback((id: string) => {
    setSelectedPlaylistId(id)
    setIsActionsVisible(true)
  }, [])

  const handleRenameConfirm = useCallback(async (newName: string) => {
    if (selectedPlaylistId) {
      await renamePlaylist(selectedPlaylistId, newName)
      notify({ message: t.playlists.renamed(newName), kind: 'success' })
      setIsRenameVisible(false)
    }
  }, [selectedPlaylistId, renamePlaylist, notify, t])

  const colors = theme.colors

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.library.yourLibrary}
        </Text>
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaylistRow
            item={item}
            onPress={handlePress}
            onMorePress={item.id !== 'all' ? handleMore : undefined}
            isFixed={item.id === 'all'}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isHydrated ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎶</Text>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                {t.playlists.emptyState}
              </Text>
            </View>
          ) : null
        }
      />

      <PlaylistActions
        visible={isActionsVisible}
        onClose={() => setIsActionsVisible(false)}
        playlistName={selectedPlaylist?.name ?? ''}
        onRename={() => setIsRenameVisible(true)}
        onDelete={() => {
          if (selectedPlaylistId) {
            deletePlaylist(selectedPlaylistId)
            notify({ message: t.playlists.deleted(selectedPlaylist?.name ?? ''), kind: 'success' })
          }
        }}
      />

      {selectedPlaylist && (
        <NameModal
          visible={isRenameVisible}
          title={t.playlists.rename}
          initialValue={selectedPlaylist.name}
          placeholder={t.playlists.enterName}
          cancelLabel={t.playlists.cancel}
          confirmLabel={t.playlists.rename}
          onCancel={() => setIsRenameVisible(false)}
          onConfirm={(v) => void handleRenameConfirm(v)}
          colors={colors}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})