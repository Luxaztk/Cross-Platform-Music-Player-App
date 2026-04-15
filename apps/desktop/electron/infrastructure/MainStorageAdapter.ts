import Store from 'electron-store';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';
import type { IStorageAdapter } from '@music/core';
import { DEFAULT_SETTINGS, type AppSettings } from '../constants/SettingsConstants';

interface StoreSchema {
  library: Playlist;
  songs: Record<string, Song>;
  playlists: Record<string, Playlist>;
  playerState: PlayerState | null;
  recentSearches: RecentSearch[];
  lyricUsage: Record<string, number>;
  settings: AppSettings;
}

export class MainStorageAdapter implements IStorageAdapter {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'melovista-library',
      defaults: {
        library: {
          id: '0',
          name: 'Library',
          description: 'All your songs',
          songIds: [],
          createdAt: new Date().toISOString()
        },
        songs: {},
        playlists: {},
        playerState: null,
        recentSearches: [],
        lyricUsage: {},
        settings: DEFAULT_SETTINGS,
      }
    });
  }

  async getLibrary(): Promise<Playlist> {
    return this.store.get('library');
  }

  async getSongs(): Promise<Record<string, Song>> {
    return this.store.get('songs');
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    this.store.set('songs', songs);
  }

  async saveLibrary(library: Playlist): Promise<void> {
    this.store.set('library', library);
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    this.store.set('playlists', playlists);
  }

  async getPlaylists(): Promise<Record<string, Playlist>> {
    const playlists = this.store.get('playlists') || {};
    const library = await this.getLibrary();
    return { '0': library, ...playlists };
  }

  async getPlayerState(): Promise<PlayerState | null> {
    return this.store.get('playerState');
  }

  async savePlayerState(state: PlayerState): Promise<void> {
    this.store.set('playerState', state);
  }

  async getSongList(): Promise<Song[]> {
    const songs = await this.getSongs();
    return Object.values(songs);
  }

  async getSongById(id: string): Promise<Song | null> {
    const songs = await this.getSongs();
    return songs[id] || null;
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    return this.store.get('recentSearches') || [];
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    this.store.set('recentSearches', searches);
  }
  
  async getLyricUsage(): Promise<Record<string, number>> {
    return this.store.get('lyricUsage') || {};
  }

  async saveLyricUsage(usage: Record<string, number>): Promise<void> {
    this.store.set('lyricUsage', usage);
  }

  async incrementLyricUsage(id: number): Promise<void> {
    const usage = await this.getLyricUsage();
    usage[id.toString()] = (usage[id.toString()] || 0) + 1;
    await this.saveLyricUsage(usage);
  }

  async patchSong(songId: string, updates: Partial<Song>): Promise<Song | null> {
    const songs = await this.getSongs();
    if (!songs[songId]) return null;
    
    const updatedSong = { ...songs[songId], ...updates };
    songs[songId] = updatedSong;
    await this.saveSongs(songs);
    return updatedSong;
  }
  async getSettings(): Promise<AppSettings> {
    return this.store.get('settings') || DEFAULT_SETTINGS;
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    this.store.set('settings', { ...current, ...settings });
  }
}
