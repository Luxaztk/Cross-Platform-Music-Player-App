import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import type { ServerHealth } from '@music/types'
import { useLibraryContext } from '@music/hooks'
import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useAppShell } from '../../presentations/components/AppShell'
import { useNotifications } from '../../presentations/components/Notification'
import { MobileServerSyncService } from '../../infrastructure/services/MobileServerSyncService'
import { MobileAudioCacheService } from '../../infrastructure/services/MobileAudioCacheService'
import { MobileOfflineService } from '../../infrastructure/services/MobileOfflineService'

type SegmentedOption<T extends string> = {
  label: string
  value: T
}

type SegmentedToggleProps<T extends string> = {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  itemWidth?: number
  colors: {
    itemWidth?: number
    primary: string
    text: string
    mutedText: string
    surfaceSolid: string
    subtleBorder: string
    inverseText: string
  }
}

const SEGMENT_ITEM_WIDTH = 55
const SEGMENT_HEIGHT = 40

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  itemWidth = SEGMENT_ITEM_WIDTH,
  colors,
}: SegmentedToggleProps<T>) {
  const [translateX] = useState(() => new Animated.Value(0))

  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: activeIndex * itemWidth,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [activeIndex, translateX])

  return (
    <View
      style={[
        styles.segmentTrack,
        {
          width: itemWidth * options.length,
          height: SEGMENT_HEIGHT,
          backgroundColor: colors.surfaceSolid,
          borderColor: colors.subtleBorder,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.segmentThumb,
          {
            width: itemWidth - 4,
            backgroundColor: colors.primary,
            transform: [{ translateX }],
          },
        ]}
      />

      {options.map((option) => {
        const isActive = option.value === value

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segmentItem,
              {
                width: itemWidth,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                {
                  color: isActive ? colors.inverseText : colors.text,
                  fontWeight: isActive ? '800' : '700',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function SettingsScreen() {
  const { theme, themeName, toggleTheme } = useTheme()
  const isDark = themeName === 'dark'
  const { t, language, setLanguage } = useLanguage()
  const { navigationLayout, setNavigationLayout } = useAppShell()
  const { songs, handleAddSongs } = useLibraryContext()
  const { notify } = useNotifications()

  const [serverUrl, setServerUrl] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [healthStatus, setHealthStatus] = useState<ServerHealth | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [cacheStats, setCacheStats] = useState<{ formattedUsed: string; formattedMax: string; count: number } | null>(null)
  const [quotaValue, setQuotaValue] = useState<'250MB' | '500MB' | '1GB'>('500MB')
  const [isClearing, setIsClearing] = useState(false)

  const offlineStats = useMemo(() => MobileOfflineService.getOfflineStats(songs), [songs])

  useEffect(() => {
    void MobileServerSyncService.getServerUrl().then((saved) => {
      if (saved) setServerUrl(saved)
    })
    void MobileAudioCacheService.getCacheStats().then((stats) => {
      setCacheStats(stats)
      if (stats.maxSizeBytes <= 250 * 1024 * 1024) setQuotaValue('250MB')
      else if (stats.maxSizeBytes >= 1024 * 1024 * 1024) setQuotaValue('1GB')
      else setQuotaValue('500MB')
    })
  }, [])

  const handleQuotaChange = useCallback(async (val: '250MB' | '500MB' | '1GB') => {
    setQuotaValue(val)
    const bytes = val === '250MB' ? 250 * 1024 * 1024 : val === '1GB' ? 1024 * 1024 * 1024 : 500 * 1024 * 1024
    await MobileAudioCacheService.setSettings({ maxSizeBytes: bytes })
    const stats = await MobileAudioCacheService.getCacheStats()
    setCacheStats(stats)
  }, [])

  const handleClearCache = useCallback(async () => {
    setIsClearing(true)
    await MobileAudioCacheService.clearCache()
    const stats = await MobileAudioCacheService.getCacheStats()
    setCacheStats(stats)
    setIsClearing(false)
    notify({
      kind: 'success',
      message: t.settings.clearCacheSuccess,
    })
  }, [notify, t])

  const handleSaveUrl = useCallback(async () => {
    if (!serverUrl.trim()) return
    const clean = await MobileServerSyncService.setServerUrl(serverUrl)
    setServerUrl(clean)
    notify({
      kind: 'success',
      message: t.settings.serverSaveSuccess,
    })
  }, [serverUrl, notify, t])

  const handleCheckConnection = useCallback(async () => {
    setIsChecking(true)
    setErrorMessage(null)
    setHealthStatus(null)

    const result = await MobileServerSyncService.checkConnection(serverUrl)
    setIsChecking(false)

    if (result.ok && result.health) {
      setHealthStatus(result.health)
      setErrorMessage(null)
      notify({
        kind: 'success',
        message: t.settings.serverConnected,
      })
    } else {
      setErrorMessage(result.error || 'Cannot connect to server')
      setHealthStatus(null)
    }
  }, [serverUrl, notify, t])

  const handleSyncSongs = useCallback(async () => {
    setIsSyncing(true)
    const result = await MobileServerSyncService.fetchServerSongs(serverUrl)
    setIsSyncing(false)

    if (result.ok && result.songs.length > 0) {
      try {
        const importRes = await handleAddSongs(result.songs)
        notify({
          kind: 'success',
          message: `Đã đồng bộ ${importRes?.count ?? result.songs.length} bài hát từ máy chủ!`,
        })
      } catch (err: any) {
        notify({
          kind: 'error',
          message: err?.message || 'Lỗi nạp bài hát vào thư viện',
        })
      }
    } else if (result.ok && result.songs.length === 0) {
      notify({
        kind: 'info',
        message: 'Máy chủ chưa có bài hát nào được quét',
      })
    } else {
      notify({
        kind: 'error',
        message: result.error || 'Không thể tải danh sách bài hát',
      })
    }
  }, [serverUrl, handleAddSongs, notify])

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>{t.settings.title}</Text>

      <View
        style={[
          styles.row,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t.settings.darkMode}</Text>
        </View>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <View
        style={[
          styles.row,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t.settings.language}</Text>
        </View>
        <SegmentedToggle
          options={[
            { value: 'en', label: 'ENG' },
            { value: 'vi', label: 'VIE' },
          ]}
          value={language}
          onChange={setLanguage}
          itemWidth={55}
          colors={theme.colors}
        />
      </View>

      <View
        style={[
          styles.row,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t.settings.navigationLayout}</Text>
        </View>
        <SegmentedToggle
          options={[
            { value: 'tabs', label: 'Tab Bar' },
            { value: 'sidebar', label: 'Sidebar' },
          ]}
          value={navigationLayout}
          onChange={setNavigationLayout}
          itemWidth={86}
          colors={theme.colors}
        />
      </View>

      <View
        style={[
          styles.serverCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.serverCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="server" size={18} color={theme.colors.primary} />
            <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
              {t.settings.serverTitle}
            </Text>
          </View>
          <Text style={[styles.serverDesc, { color: theme.colors.mutedText }]}>
            {t.settings.serverDesc}
          </Text>
        </View>

        <View style={styles.serverInputRow}>
          <TextInput
            value={serverUrl}
            onChangeText={setServerUrl}
            onBlur={handleSaveUrl}
            placeholder="http://192.168.1.185:4545"
            placeholderTextColor={theme.colors.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
              },
            ]}
          />
          <Pressable
            onPress={handleCheckConnection}
            disabled={isChecking}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity: isChecking ? 0.6 : pressed ? 0.8 : 1,
              },
            ]}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="wifi" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>
                  {t.settings.serverTestBtn}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {healthStatus && (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="check-circle" size={14} color={theme.colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.primary }}>
                  {t.settings.serverConnected}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.mutedText }}>
                {healthStatus.service} v{healthStatus.version} • {healthStatus.totalSongs} bài hát
              </Text>
            </View>

            <Pressable
              onPress={handleSyncSongs}
              disabled={isSyncing}
              style={({ pressed }) => [
                styles.syncBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: isSyncing ? 0.6 : pressed ? 0.8 : 1,
                },
              ]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name="refresh-cw" size={12} color="#fff" />
                  <Text style={styles.actionBtnText}>{t.settings.serverSyncBtn}</Text>
                </View>
              )}
            </Pressable>
          </View>
        )}

        {errorMessage && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              },
            ]}
          >
            <Feather name="alert-circle" size={14} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 12, flex: 1 }}>
              {errorMessage}
            </Text>
          </View>
        )}
      </View>

      {/* Cache & Offline Card */}
      <View
        style={[
          styles.serverCard,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.serverCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="database" size={18} color={theme.colors.primary} />
            <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
              {t.settings.cacheTitle}
            </Text>
          </View>
          <Text style={[styles.serverDesc, { color: theme.colors.mutedText }]}>
            {t.settings.cacheDesc}
          </Text>
        </View>

        {/* Cache Stats Row */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: theme.colors.surfaceSolid,
              borderColor: theme.colors.subtleBorder,
            },
          ]}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }}>
              {t.settings.cacheUsed}: {cacheStats?.formattedUsed ?? '0.0 MB'} / {cacheStats?.formattedMax ?? '500.0 MB'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.mutedText }}>
              {cacheStats?.count ?? 0} bài đệm tự động • {offlineStats.count} bài tải Offline ({offlineStats.formattedSize})
            </Text>
          </View>

          <Pressable
            onPress={handleClearCache}
            disabled={isClearing}
            style={({ pressed }) => [
              styles.syncBtn,
              {
                backgroundColor: '#ef4444',
                opacity: isClearing ? 0.6 : pressed ? 0.8 : 1,
              },
            ]}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="trash-2" size={12} color="#fff" />
                <Text style={styles.actionBtnText}>{t.settings.clearCache}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Quota Selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text }}>
            {t.settings.cacheQuota}
          </Text>
          <SegmentedToggle
            options={[
              { value: '250MB', label: '250MB' },
              { value: '500MB', label: '500MB' },
              { value: '1GB', label: '1GB' },
            ]}
            value={quotaValue}
            onChange={handleQuotaChange}
            itemWidth={60}
            colors={theme.colors}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 140,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  row: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  langPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  serverCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  serverCardHeader: {
    gap: 4,
  },
  serverDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  serverInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  actionBtn: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  segmentTrack: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    overflow: 'hidden',
  },
  segmentThumb: {
    position: 'absolute',
    left: 2,
    top: 2,
    bottom: 2,
    borderRadius: 999,
  },
  segmentItem: {
    height: SEGMENT_HEIGHT - 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 13,
  },
})
