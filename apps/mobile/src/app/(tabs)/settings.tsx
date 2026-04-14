import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useTheme } from '../../theme'
import { useLanguage } from '../../i18n'

export default function SettingsScreen() {
  const { theme, themeName, toggleTheme, isHydrated } = useTheme()
  const isDark = themeName === 'dark'
  const { t, language, setLanguage, isHydrated: isLanguageHydrated } = useLanguage()

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
          <Text style={[styles.rowSubtitle, { color: theme.colors.mutedText }]}>
            {isHydrated ? t.common.savedToDevice : t.common.loadingPreference}
          </Text>
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
          <Text style={[styles.rowSubtitle, { color: theme.colors.mutedText }]}>
            {isLanguageHydrated ? t.common.savedToDevice : t.common.loadingPreference}
          </Text>
        </View>
        <View style={styles.langPills}>
          <Pressable
            onPress={() => setLanguage('en')}
            style={[
              styles.pill,
              language === 'en' && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
              language !== 'en' && { borderColor: theme.colors.border },
            ]}
          >
            <Text
              style={[styles.pillText, { color: language === 'en' ? '#fff' : theme.colors.text }]}
            >
              {t.settings.english}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage('vi')}
            style={[
              styles.pill,
              language === 'vi' && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
              language !== 'vi' && { borderColor: theme.colors.border },
            ]}
          >
            <Text
              style={[styles.pillText, { color: language === 'vi' ? '#fff' : theme.colors.text }]}
            >
              {t.settings.vietnamese}
            </Text>
          </Pressable>
        </View>
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
})
