import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useMobileLyrics } from '../application/hooks/useMobileLyrics'
import { useLanguage } from '../presentations/components/Language'
import { useNotifications } from '../presentations/components/Notification'
import { useTheme } from '../presentations/components/Theme'

export default function LyricsScreen() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { notify } = useNotifications()
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList>(null)
  const lyrics = useMobileLyrics()

  useEffect(() => {
    if (lyrics.currentLineIndex >= 0 && lyrics.lyricLines.length > 0) {
      listRef.current?.scrollToIndex({ index: lyrics.currentLineIndex, animated: true, viewPosition: 0.45 })
    }
  }, [lyrics.currentLineIndex, lyrics.lyricLines.length])

  const chooseResult = async (index: number) => {
    const saved = await lyrics.selectResult(lyrics.results[index])
    notify({ kind: saved ? 'success' : 'error', message: saved ? t.lyrics.saved : t.lyrics.saveFailed })
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}> 
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconButton}>
          <Feather name="chevron-left" size={26} color={theme.colors.text} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t.lyrics.title}</Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.colors.mutedText }]}>
            {lyrics.currentSong ? `${lyrics.currentSong.title} · ${lyrics.currentSong.artist}` : t.lyrics.noSong}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={lyrics.query}
          onChangeText={lyrics.setQuery}
          onSubmitEditing={() => void lyrics.search()}
          placeholder={t.lyrics.searchPlaceholder}
          placeholderTextColor={theme.colors.mutedText}
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        />
        <Pressable disabled={!lyrics.currentSong || lyrics.isSearching} onPress={() => void lyrics.search()} style={[styles.searchButton, { backgroundColor: theme.colors.primary, opacity: lyrics.isSearching ? 0.65 : 1 }]}>
          {lyrics.isSearching ? <ActivityIndicator color="#fff" /> : <Feather name="search" size={20} color="#fff" />}
        </Pressable>
      </View>

      {lyrics.results.length > 0 ? (
        <ScrollView contentContainerStyle={styles.results}>
          <Text style={[styles.sectionLabel, { color: theme.colors.mutedText }]}>{t.lyrics.searchResults}</Text>
          {lyrics.results.map((result, index) => (
            <Pressable key={result.id} disabled={lyrics.isSaving} onPress={() => void chooseResult(index)} style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.resultText}>
                <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{result.trackName}</Text>
                <Text style={{ color: theme.colors.mutedText }}>{result.artistName}{result.albumName ? ` · ${result.albumName}` : ''}</Text>
              </View>
              <Feather name={result.syncedLyrics ? 'clock' : 'file-text'} size={18} color={theme.colors.primary} />
            </Pressable>
          ))}
        </ScrollView>
      ) : lyrics.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : lyrics.lyricLines.length > 0 ? (
        <FlatList
          ref={listRef}
          data={lyrics.lyricLines}
          keyExtractor={(item, index) => `${item.time}-${index}`}
          contentContainerStyle={styles.lyricList}
          onScrollToIndexFailed={() => undefined}
          renderItem={({ item, index }) => {
            const active = index === lyrics.currentLineIndex
            return (
              <Pressable onPress={() => void lyrics.seek(item.time)} style={styles.lyricLine}>
                <Text style={[styles.lyricText, { color: active ? theme.colors.primary : theme.colors.mutedText }, active && styles.activeLyric]}>{item.text}</Text>
              </Pressable>
            )
          }}
        />
      ) : lyrics.rawLyrics ? (
        <ScrollView contentContainerStyle={styles.plainLyrics}>
          <Text style={[styles.plainText, { color: theme.colors.text }]}>{lyrics.rawLyrics}</Text>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Feather name="music" size={36} color={theme.colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{lyrics.error || t.lyrics.noLyrics}</Text>
          <Text style={[styles.emptyHint, { color: theme.colors.mutedText }]}>{t.lyrics.searchHint}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { minHeight: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, paddingRight: 42 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 12, marginTop: 3, textAlign: 'center' },
  searchRow: { flexDirection: 'row', gap: 10, padding: 16 },
  input: { flex: 1, height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  searchButton: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 12 },
  results: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderRadius: 12 },
  resultText: { flex: 1, gap: 4 },
  resultTitle: { fontSize: 15, fontWeight: '700' },
  lyricList: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 160 },
  lyricLine: { paddingVertical: 13 },
  lyricText: { fontSize: 21, lineHeight: 29, fontWeight: '600', textAlign: 'center' },
  activeLyric: { fontSize: 25, lineHeight: 33, fontWeight: '800' },
  plainLyrics: { paddingHorizontal: 24, paddingVertical: 30, paddingBottom: 100 },
  plainText: { fontSize: 17, lineHeight: 28, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyHint: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
})
