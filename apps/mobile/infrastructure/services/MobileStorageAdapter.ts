import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song, Playlist, PlayerState } from '@music/types';
import type { IStorageAdapter } from '@music/core';

const STORAGE_KEYS = {
  SONGS: 'melovista_songs',
  LIBRARY: 'melovista_library',
  PLAYLISTS: 'melovista_playlists',
  PLAYER_STATE: 'melovista_player_state'
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
}
