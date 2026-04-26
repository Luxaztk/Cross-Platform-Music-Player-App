import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ThemeName } from './tokens'

const THEME_KEY = 'melovista:theme'

export async function loadThemePreference(): Promise<ThemeName | null> {
  const value = await AsyncStorage.getItem(THEME_KEY)
  if (value === 'light' || value === 'dark') return value
  return null
}

export async function saveThemePreference(theme: ThemeName): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme)
}
