import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useTheme } from '../../presentations/components/Theme'
import { useLanguage } from '../../presentations/components/Language'
import { useAppShell } from '../../presentations/components/AppShell'

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
  const { theme, themeName, toggleTheme, isHydrated } = useTheme()
  const isDark = themeName === 'dark'
  const { t, language, setLanguage, isHydrated: isLanguageHydrated } = useLanguage()
  const { navigationLayout, setNavigationLayout } = useAppShell()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{t.settings.title}</Text>

      <View
        style={[
          styles.row,
          { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{t.settings.darkMode}</Text>
          {/* <Text style={[styles.rowSubtitle, { color: theme.colors.mutedText }]}>
            {isHydrated ? t.common.savedToDevice : t.common.loadingPreference}
          </Text> */}
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
          {/* <Text style={[styles.rowSubtitle, { color: theme.colors.mutedText }]}>
            {isLanguageHydrated ? t.common.savedToDevice : t.common.loadingPreference}
          </Text> */}
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
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Navigation Layout</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
