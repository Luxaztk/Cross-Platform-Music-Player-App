import { Tabs } from 'expo-router'

/**
 * Tabs layout — headers and the bottom tab bar are hidden because
 * navigation is handled by the persistent TopBar + SidebarMenu
 * rendered in the root layout.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      {/* <Tabs.Screen name="library" /> */}
      <Tabs.Screen name="search" />
      <Tabs.Screen name="playlists" />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}
