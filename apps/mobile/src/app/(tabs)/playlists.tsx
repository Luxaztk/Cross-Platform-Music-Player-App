import React, { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'

import type { Playlist } from '@music/types'

import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useNotifications } from '../../presentations/components/Notification'
import { useLibrary } from '../../application'

const PlaylistRow = React.memo(function PlaylistRow({
  item,
  onPress,
  onRename,
  onDelete,
  colors,
  strings,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: {
  item: Playlist
  onPress: (id: string) => void
  onRename: (id: string, currentName: string) => void
  onDelete: (id: string, name: string) => void
  colors: { surface: string; border: string; text: string; mutedText: string; primary: string; background: string }
  strings: { rename: string; delete: string; songCount: (n: number) => string }
  isMenuOpen: boolean
  onToggleMenu: (id: string) => void
  onCloseMenu: () => void
}) {
  return (
    <View style={styles.rowWrap}>
      <Pressable
        onPress={() => {
          if (isMenuOpen) {
            onCloseMenu()
            return
          }
          onPress(item.id)
        }}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
          <Text style={styles.rowIconText}>🎶</Text>
        </View>

        <View style={styles.rowInfo}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.rowSub, { color: colors.mutedText }]}>
            {strings.songCount(item.songIds.length)}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            onToggleMenu(item.id)
          }}
          hitSlop={8}
          style={styles.moreBtn}
        >
          <Text style={[styles.moreText, { color: colors.mutedText }]}>⋯</Text>
        </Pressable>
      </Pressable>

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
                onRename(item.id, item.name)
              }}
            >
              <Text style={[styles.menuText, { color: colors.text }]}>{strings.rename}</Text>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onCloseMenu()
                onDelete(item.id, item.name)
              }}
            >
              <Text style={[styles.menuText, { color: '#FF5A5F' }]}>{strings.delete}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
})

function NameModal({
  visible,
  title,
  initialValue,
  placeholder,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  colors,
}: {
  visible: boolean
  title: string
  initialValue: string
  placeholder: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: (value: string) => void
  colors: {
    background: string
    surface: string
    text: string
    mutedText: string
    border: string
    primary: string
  }
}) {
  const [value, setValue] = useState(initialValue)
  const [prevVisible, setPrevVisible] = useState(visible)
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue)

  if (visible !== prevVisible || initialValue !== prevInitialValue) {
    setPrevVisible(visible)
    setPrevInitialValue(initialValue)
    if (visible) {
      setValue(initialValue)
    }
  }

  const trimmed = value.trim()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            autoFocus
            selectTextOnFocus
            maxLength={80}
          />

          <View style={styles.modalBtns}>
            <Pressable onPress={onCancel} style={[styles.modalBtn, { borderColor: colors.border }]}>
              <Text style={[styles.modalBtnText, { color: colors.mutedText }]}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() => trimmed && onConfirm(trimmed)}
              disabled={!trimmed}
              style={[
                styles.modalBtn,
                { backgroundColor: trimmed ? colors.primary : colors.border },
              ]}
            >
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default function PlaylistsScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const { isHydrated, playlistsById, createPlaylist, renamePlaylist, deletePlaylist } = useLibrary()

  const [modalMode, setModalMode] = useState<'create' | 'rename' | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [openedMenuId, setOpenedMenuId] = useState<string | null>(null)

  const playlists = useMemo(() => {
    return Object.values(playlistsById)
      .filter((p) => p.id !== '0')
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }, [playlistsById])

  const playlistCount = playlists.length

  const onPressCreate = useCallback(() => {
    setOpenedMenuId(null)
    setModalMode('create')
    setRenameTarget(null)
  }, [])

  const onPressRename = useCallback((id: string, currentName: string) => {
    setModalMode('rename')
    setRenameTarget({ id, name: currentName })
  }, [])

  const onPressDelete = useCallback(
    (id: string, name: string) => {
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
    },
    [deletePlaylist, notify, t],
  )

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

  const onToggleMenu = useCallback((id: string) => {
    setOpenedMenuId((prev) => (prev === id ? null : id))
  }, [])

  const onCloseMenu = useCallback(() => {
    setOpenedMenuId(null)
  }, [])

  const colors = theme.colors

  const renderItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistRow
        item={item}
        onPress={onPressPlaylist}
        onRename={onPressRename}
        onDelete={onPressDelete}
        colors={colors}
        strings={{
          rename: 'Sửa tên playlist',
          delete: 'Xóa playlist',
          songCount: t.playlists.songCount,
        }}
        isMenuOpen={openedMenuId === item.id}
        onToggleMenu={onToggleMenu}
        onCloseMenu={onCloseMenu}
      />
    ),
    [onPressPlaylist, onPressRename, onPressDelete, colors, t, openedMenuId, onToggleMenu, onCloseMenu],
  )

  const keyExtractor = useCallback((item: Playlist) => item.id, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t.playlists.title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            {isHydrated ? t.playlists.playlistCount(playlistCount) : t.common.loadingPreference}
          </Text>
        </View>

        <Pressable
          onPress={onPressCreate}
          style={[styles.createBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.createBtnText}>＋</Text>
        </Pressable>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingBottom: 110,
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
    width: 42,
    height: 42,
    borderRadius: 21,
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
    marginTop: 18,
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
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