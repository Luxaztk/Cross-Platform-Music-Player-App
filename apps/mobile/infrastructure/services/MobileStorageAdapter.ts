import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';
import type { IStorageAdapter } from '@music/core';

const STORAGE_KEYS = {
  SONGS: 'melovista_songs',
  LIBRARY: 'melovista_library',
  PLAYLISTS: 'melovista_playlists',
  PLAYER_STATE: 'melovista_player_state',
  RECENT_SEARCHES: 'melovista_recent_searches',
  LYRIC_USAGE: 'melovista_lyric_usage'
};

export class MobileStorageAdapter implements IStorageAdapter {
  async getSongs(): Promise<Record<string, Song>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SONGS);
    return data ? JSON.parse(data) : {};
  }

  async getLibrary(): Promise<Playlist> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LIBRARY);
    if (data) return JSON.parse(data);
    return {
      id: '0',
      name: 'Library',
      description: 'All your songs',
      songIds: [],
      createdAt: new Date().toISOString()
    };
  }

  async getPlaylists(): Promise<Record<string, Playlist>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    return data ? JSON.parse(data) : {};
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
  }

  async saveLibrary(library: Playlist): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(library));
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
  }

  async getPlayerState(): Promise<PlayerState | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_STATE);
    return data ? JSON.parse(data) : null;
  }

  async savePlayerState(state: PlayerState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify(state));
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
    return data ? JSON.parse(data) : [];
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
  }

  async getLyricUsage(): Promise<Record<string, number>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LYRIC_USAGE);
    return data ? JSON.parse(data) : {};
  }

  async saveLyricUsage(usage: Record<string, number>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LYRIC_USAGE, JSON.stringify(usage));
  }

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }
}
