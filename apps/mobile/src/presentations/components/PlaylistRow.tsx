import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import type { Playlist } from '@music/types'
import { useTheme } from './Theme'

import { useLanguage } from './Language'

interface PlaylistRowProps {
  item: Playlist | { id: string; name: string; songIds: string[]; isSpecial?: boolean }
  onPress: (id: string) => void
  onMorePress?: (id: string) => void
  isFixed?: boolean
}

export const PlaylistRow = React.memo(function PlaylistRow({
  item,
  onPress,
  onMorePress,
  isFixed,
}: PlaylistRowProps) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { colors } = theme

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.primary + '10' : 'transparent',
        },
      ]}
    >
      <View style={[styles.cover, { backgroundColor: colors.primary + '18' }]}>
        {item.isSpecial ? (
          <Feather name="heart" size={24} color={colors.primary} />
        ) : (
          <Feather name="music" size={24} color={colors.primary} />
        )}
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.count, { color: colors.mutedText }]}>
          {t.playlists.songCount(item.songIds.length)}
        </Text>
      </View>

      {!isFixed && onMorePress && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            onMorePress(item.id)
          }}
          hitSlop={12}
          style={styles.moreBtn}
        >
          <Feather name="more-horizontal" size={20} color={colors.mutedText} />
        </Pressable>
      )}
    </Pressable>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    fontSize: 13,
  },
  moreBtn: {
    padding: 8,
  },
})
