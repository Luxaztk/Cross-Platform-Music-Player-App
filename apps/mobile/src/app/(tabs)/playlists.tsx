import React, { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'

import type { Playlist } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { useLibrary } from '../../application'
import { usePlayer } from '../../application/player'
import { PLAYER_BAR_HEIGHT } from '../../presentations/player/PlayerBar'
import { NameModal } from '../../presentations/components/NameModal'
import { PlaylistRow } from '../../presentations/components/PlaylistRow'
import { PlaylistActions } from '../../presentations/components/PlaylistActions'

const shuffleArray = <T,>(arr: T[]): T[] => {
  const newArr = [...arr]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

const CREATE_PLAYLIST_BTN_HEIGHT = 42;

export default function PlaylistsScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const {
    isHydrated,
    library,
    playlistsById,
    createPlaylist,
    duplicatePlaylist,
    renamePlaylist,
    deletePlaylist,
  } = useLibrary()

  const { playNextSongs, addSongsToQueue, playList } = usePlayer()

  const [modalMode, setModalMode] = useState<'create' | 'rename' | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [actionsVisible, setActionsVisible] = useState(false)

  const playlists = useMemo(() => {
    const customPlaylists = Object.values(playlistsById)
      .filter((p) => p.id !== '0')
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    const allSongsPlaylist = {
      ...library,
      id: '0',
      name: t.library.allSongs,
      isSpecial: true,
    } as Playlist

    return [allSongsPlaylist, ...customPlaylists]
  }, [playlistsById, library, t])

  const playlistCount = Object.values(playlistsById).filter((p) => p.id !== '0').length

  const onPressCreate = useCallback(() => {
    setModalMode('create')
    setRenameTarget(null)
  }, [])

  const onPressPlaylist = useCallback((id: string) => {
    router.push({ pathname: '/playlist/[id]', params: { id } })
  }, [])

  const onModalConfirm = useCallback(
    async (value: string) => {
      if (modalMode === 'create') {
        await createPlaylist(value)
        notify({ message: t.playlists.created(value), kind: 'success' })
      } else if (modalMode === 'rename' && renameTarget) {
        await renamePlaylist(renameTarget.id, value)
        notify({ message: t.playlists.renamed(value), kind: 'success' })
      }
      setModalMode(null)
      setRenameTarget(null)
    },
    [modalMode, renameTarget, createPlaylist, renamePlaylist, notify, t],
  )

  const onModalCancel = useCallback(() => {
    setModalMode(null)
    setRenameTarget(null)
  }, [])

  const onMorePress = useCallback((id: string) => {
    const playlist = playlists.find((p) => p.id === id)
    if (playlist) {
      setSelectedPlaylist(playlist)
      setActionsVisible(true)
    }
  }, [playlists])

  const onLongPress = useCallback((id: string) => {
    const playlist = playlists.find((p) => p.id === id)
    if (playlist) {
      setSelectedPlaylist(playlist)
      setActionsVisible(true)
    }
  }, [playlists])

  const handlePlayNext = useCallback(async () => {
    if (!selectedPlaylist) return
    if (selectedPlaylist.songIds.length === 0) {
      notify({ message: t.playlists.emptyPlaylist, kind: 'info' })
      return
    }
    await playNextSongs(selectedPlaylist.songIds)
    notify({ message: t.playlists.addedToPlayNext, kind: 'success' })
  }, [selectedPlaylist, playNextSongs, notify, t])

  const handleAddToQueue = useCallback(async () => {
    if (!selectedPlaylist) return
    if (selectedPlaylist.songIds.length === 0) {
      notify({ message: t.playlists.emptyPlaylist, kind: 'info' })
      return
    }
    await addSongsToQueue(selectedPlaylist.songIds)
    notify({ message: t.playlists.addedToQueue, kind: 'success' })
  }, [selectedPlaylist, addSongsToQueue, notify, t])

  const handleShuffle = useCallback(async () => {
    if (!selectedPlaylist) return
    if (selectedPlaylist.songIds.length === 0) {
      notify({ message: t.playlists.emptyPlaylist, kind: 'info' })
      return
    }
    const shuffled = shuffleArray(selectedPlaylist.songIds)
    await playList(shuffled, 0)
    notify({ message: t.playlists.shuffling, kind: 'success' })
  }, [selectedPlaylist, playList, notify, t])

  const handleDuplicate = useCallback(async () => {
    if (!selectedPlaylist) return
    try {
      const sourceName = selectedPlaylist.id === '0' ? t.library.allSongs : selectedPlaylist.name
      const suffix = t.playlists.rename === 'Đổi tên' ? ' (Sao chép)' : ' (Copy)'
      const name = `${sourceName}${suffix}`

      const copy = await duplicatePlaylist(selectedPlaylist.id, name)
      notify({ message: t.playlists.duplicated(copy.name), kind: 'success' })
    } catch (err) {
      console.error(err)
      notify({ message: 'Không thể sao chép playlist', kind: 'error' })
    }
  }, [selectedPlaylist, duplicatePlaylist, notify, t])

  const handleRename = useCallback(() => {
    if (!selectedPlaylist) return
    setModalMode('rename')
    setRenameTarget({ id: selectedPlaylist.id, name: selectedPlaylist.name })
  }, [selectedPlaylist])

  const handleDelete = useCallback(() => {
    if (!selectedPlaylist) return
    const id = selectedPlaylist.id
    const name = selectedPlaylist.name
    Alert.alert(t.playlists.confirmDelete(name), '', [
      { text: t.playlists.cancel, style: 'cancel' },
      {
        text: t.playlists.delete,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deletePlaylist(id)
            notify({ message: t.playlists.deleted(name), kind: 'success' })
          })()
        },
      },
    ])
  }, [selectedPlaylist, deletePlaylist, notify, t])

  const colors = theme.colors

  const renderItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistRow
        item={item}
        onPress={onPressPlaylist}
        onLongPress={onLongPress}
        onMorePress={onMorePress}
        isFixed={item.id === '0'}
      />
    ),
    [onPressPlaylist, onLongPress, onMorePress],
  )

  const keyExtractor = useCallback((item: Playlist) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {/* <View>
          <Text style={[styles.title, { color: theme.colors.mutedText }]}>
            {isHydrated ? t.playlists.playlistCount(playlistCount) : t.common.loadingPreference}
          </Text>
        </View> */}


      </View>

      <FlatList
        style={styles.list}
        data={playlists}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isHydrated ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📁</Text>
              <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
                {t.playlists.emptyState}
              </Text>
            </View>
          ) : null
        }
      />

      <NameModal
        visible={modalMode !== null}
        title={modalMode === 'create' ? t.playlists.create : t.playlists.rename}
        initialValue={modalMode === 'rename' && renameTarget ? renameTarget.name : ''}
        placeholder={t.playlists.enterName}
        cancelLabel={t.playlists.cancel}
        confirmLabel={modalMode === 'create' ? t.playlists.create : t.playlists.rename}
        onCancel={onModalCancel}
        onConfirm={(v) => void onModalConfirm(v)}
        colors={colors}
      />

      {selectedPlaylist && (
        <PlaylistActions
          visible={actionsVisible}
          onClose={() => setActionsVisible(false)}
          playlistId={selectedPlaylist.id}
          playlistName={selectedPlaylist.name}
          onRename={handleRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onPlayNext={handlePlayNext}
          onAddToQueue={handleAddToQueue}
          onShuffle={handleShuffle}
        />
      )}
      <Pressable
        onPress={onPressCreate}
        style={[styles.createBtn, { backgroundColor: theme.colors.primary, position: 'absolute', bottom: PLAYER_BAR_HEIGHT + 20, right: 12 }]}
      >
        <Text style={styles.createBtnText}>＋</Text>
      </Pressable>
    </View>
  )
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  createBtn: {
    width: CREATE_PLAYLIST_BTN_HEIGHT,
    height: CREATE_PLAYLIST_BTN_HEIGHT,
    borderRadius: "50%",
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: CREATE_PLAYLIST_BTN_HEIGHT + PLAYER_BAR_HEIGHT
  },
  rowWrap: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: 20,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12,
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
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
    top: 58,
    right: 8,
    minWidth: 170,
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
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    borderRadius: 18,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
})