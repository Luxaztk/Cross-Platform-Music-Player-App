import React from 'react'
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePlayerState, type QueueItem } from '../../application/player'
import { useTheme } from '../components/Theme'
import { useLibrary } from '../../application/library/LibraryProvider'

interface QueueModalProps {
  visible: boolean
  onClose: () => void
}

export function QueueModal({ visible, onClose }: QueueModalProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { queueItems, removeFromQueue, reorderQueue, clearQueue } = usePlayerState()
  const { songsById } = useLibrary()

  const renderItem = ({ item, index }: { item: QueueItem; index: number }) => {
    const song = songsById[item.id]
    if (!song) return null

    return (
      <View style={[styles.item, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={[styles.itemArtist, { color: theme.colors.mutedText }]} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>

        <View style={styles.itemControls}>
          <View style={styles.reorderGroup}>
            {index > 0 && (
              <Pressable
                onPress={() => void reorderQueue(index, index - 1)}
                style={[styles.reorderBtn, { backgroundColor: theme.colors.surface }]}
              >
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>↑</Text>
              </Pressable>
            )}
            {index < queueItems.length - 1 && (
              <Pressable
                onPress={() => void reorderQueue(index, index + 1)}
                style={[styles.reorderBtn, { backgroundColor: theme.colors.surface }]}
              >
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>↓</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => void removeFromQueue(index)}
            style={styles.removeBtn}
          >
            <Text style={{ color: '#ff4444', fontSize: 20 }}>✕</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: Platform.OS === 'ios' ? 0 : insets.top,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Danh sách chờ</Text>
          
          <View style={styles.headerActions}>
            {queueItems.length > 0 && (
              <Pressable onPress={() => void clearQueue()} style={styles.clearBtn}>
                <Text style={{ color: '#ff4444', fontWeight: '600' }}>Xóa hết</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.colors.primary }]}>Đóng</Text>
            </Pressable>
          </View>
        </View>

        {queueItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              Hàng đợi đang trống
            </Text>
          </View>
        ) : (
          <FlatList
            data={queueItems}
            keyExtractor={(item) => item.uid}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeBtn: {
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearBtn: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemArtist: {
    fontSize: 13,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reorderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
})
