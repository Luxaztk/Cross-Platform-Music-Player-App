import AsyncStorage from '@react-native-async-storage/async-storage'
import type { LanguageCode } from './translations'

const LANGUAGE_KEY = 'melovista:language'

export async function loadLanguagePreference(): Promise<LanguageCode | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY)
  if (value === 'en' || value === 'vi') return value
  return null
}

export async function saveLanguagePreference(language: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language)
}
