import { Tabs } from 'expo-router'
import { useLanguage } from '../../i18n'

export default function TabsLayout() {
  const { t } = useLanguage()
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen
        name="library"
        options={{
          title: t.tabs.library,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t.tabs.search,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: t.tabs.playlists,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
        }}
      />
    </Tabs>
  )
}
