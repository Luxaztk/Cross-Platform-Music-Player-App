import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IStorageAdapter } from '@music/core'
import type { Playlist, PlayerState, RecentSearch, Song } from '@music/types'

import { safeJsonParse } from './json'
import {
  LIBRARY_PLAYLIST_KEY,
  PLAYER_STATE_KEY,
  PLAYLISTS_BY_ID_KEY,
  RECENT_SEARCHES_KEY,
  SONGS_BY_ID_KEY,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from './keys'
import { composePlaylists } from './composePlaylists'

function defaultLibraryPlaylist(): Playlist {
  return {
    id: '0',
    name: 'Library',
    description: 'All your songs',
    songIds: [],
    createdAt: new Date().toISOString(),
  }
}

export class MobileStorageAdapter implements IStorageAdapter {
  private hydrated = false

  private async hydrateIfNeeded(): Promise<void> {
    if (this.hydrated) return

    const version = await AsyncStorage.getItem(STORAGE_VERSION_KEY)

    // v0 => no version key. Initialize missing keys and mark v1.
    if (!version) {
      const existing = await AsyncStorage.multiGet([
        LIBRARY_PLAYLIST_KEY,
        SONGS_BY_ID_KEY,
        PLAYLISTS_BY_ID_KEY,
        PLAYER_STATE_KEY,
        RECENT_SEARCHES_KEY,
      ])

      const map = new Map(existing)

      if (!map.get(LIBRARY_PLAYLIST_KEY)) {
        await AsyncStorage.setItem(LIBRARY_PLAYLIST_KEY, JSON.stringify(defaultLibraryPlaylist()))
      }
      if (!map.get(SONGS_BY_ID_KEY)) {
        await AsyncStorage.setItem(SONGS_BY_ID_KEY, JSON.stringify({}))
      }
      if (!map.get(PLAYLISTS_BY_ID_KEY)) {
        await AsyncStorage.setItem(PLAYLISTS_BY_ID_KEY, JSON.stringify({}))
      }
      if (!map.get(PLAYER_STATE_KEY)) {
        await AsyncStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(null))
      }
      if (!map.get(RECENT_SEARCHES_KEY)) {
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([]))
      }

      await AsyncStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION)
    }

    this.hydrated = true
  }

  async getSongs(): Promise<Record<string, Song>> {
    await this.hydrateIfNeeded()
    const raw = await AsyncStorage.getItem(SONGS_BY_ID_KEY)
    return safeJsonParse<Record<string, Song>>(raw, {})
  }

  async getLibrary(): Promise<Playlist> {
    await this.hydrateIfNeeded()
    const raw = await AsyncStorage.getItem(LIBRARY_PLAYLIST_KEY)
    return safeJsonParse<Playlist>(raw, defaultLibraryPlaylist())
  }

  async getPlaylists(): Promise<Record<string, Playlist>> {
    await this.hydrateIfNeeded()
    const raw = await AsyncStorage.getItem(PLAYLISTS_BY_ID_KEY)
    const playlistsById = safeJsonParse<Record<string, Playlist>>(raw, {})
    const library = await this.getLibrary()
    return composePlaylists(library, playlistsById)
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    await this.hydrateIfNeeded()
    await AsyncStorage.setItem(SONGS_BY_ID_KEY, JSON.stringify(songs))
  }

  async saveLibrary(library: Playlist): Promise<void> {
    await this.hydrateIfNeeded()
    await AsyncStorage.setItem(LIBRARY_PLAYLIST_KEY, JSON.stringify(library))
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    await this.hydrateIfNeeded()
    // Caller should store only user playlists; we keep library separate.
    const userPlaylists = { ...playlists }
    delete userPlaylists['0']
    await AsyncStorage.setItem(PLAYLISTS_BY_ID_KEY, JSON.stringify(userPlaylists))
  }

  async getPlayerState(): Promise<PlayerState | null> {
    await this.hydrateIfNeeded()
    const raw = await AsyncStorage.getItem(PLAYER_STATE_KEY)
    return safeJsonParse<PlayerState | null>(raw, null)
  }

  async savePlayerState(state: PlayerState): Promise<void> {
    await this.hydrateIfNeeded()
    await AsyncStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state))
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    await this.hydrateIfNeeded()
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY)
    return safeJsonParse<RecentSearch[]>(raw, [])
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    await this.hydrateIfNeeded()
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches))
  }

  async getLyricUsage(): Promise<Record<string, number>> {
    const data = await AsyncStorage.getItem('melovista_lyric_usage');
    return data ? JSON.parse(data) : {};
  }

  async saveLyricUsage(usage: Record<string, number>): Promise<void> {
    await AsyncStorage.setItem('melovista_lyric_usage', JSON.stringify(usage));
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      LIBRARY_PLAYLIST_KEY,
      SONGS_BY_ID_KEY,
      PLAYLISTS_BY_ID_KEY,
      PLAYER_STATE_KEY,
      RECENT_SEARCHES_KEY,
      STORAGE_VERSION_KEY,
      'melovista_lyric_usage'
    ]);
    this.hydrated = false;
  }
}
