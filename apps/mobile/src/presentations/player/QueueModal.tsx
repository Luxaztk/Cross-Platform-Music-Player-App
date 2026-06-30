import React, { useCallback } from 'react'
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
import { router } from 'expo-router'
import Feather from '@expo/vector-icons/Feather'

import { usePlayer } from '@music/hooks'
import type { QueueItem } from '@music/hooks'
import { useTheme } from '../components/Theme'
import { useLanguage } from '../components/Language'

interface QueueModalProps {
  visible: boolean
  onClose: () => void
}

export function QueueModal({ visible, onClose }: QueueModalProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const { queue, removeFromQueue, reorderQueue } = usePlayer()

  const handleClearQueue = useCallback(async () => {
    for (let i = queue.length - 1; i >= 0; i--) {
      removeFromQueue(i)
    }
    onClose()
    router.back()
  }, [queue, removeFromQueue, onClose])

  const handlePlaySong = useCallback((index: number) => {
    // Implementation for playing a song from queue at specific index
    // This would typically update the player state
  }, [])

  const renderItem = ({ item, index }: { item: QueueItem; index: number }) => {
    const song = item.song
    if (!song) return null

    return (
      <Pressable
        onPress={() => handlePlaySong(index)}
        style={[styles.item, { borderBottomColor: theme.colors.border }]}
      >
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
                <Feather name="chevron-up" size={16} color={theme.colors.text} />
              </Pressable>
            )}
            {index < queue.length - 1 && (
              <Pressable
                onPress={() => void reorderQueue(index, index + 1)}
                style={[styles.reorderBtn, { backgroundColor: theme.colors.surface }]}
              >
                <Feather name="chevron-down" size={16} color={theme.colors.text} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => void removeFromQueue(index)}
            style={styles.removeBtn}
          >
            <Feather name="x" size={20} color="#ff4444" />
          </Pressable>
        </View>
      </Pressable>
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
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Up Next</Text>
            <Text style={[styles.queueCount, { color: theme.colors.mutedText }]}>
              {queue.length} {queue.length === 1 ? 'song' : 'songs'}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {queue.length > 0 && (
              <Pressable onPress={handleClearQueue} style={styles.clearBtn}>
                <Feather name="trash-2" size={20} color="#ff4444" />
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {queue.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="list" size={48} color={theme.colors.mutedText} />
            <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>
              Queue is empty
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
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
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  queueCount: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeBtn: {
    padding: 8,
  },
  clearBtn: {
    padding: 8,
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
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
})
