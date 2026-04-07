import Store from 'electron-store';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';
import type { IStorageAdapter } from '@music/core';

interface StoreSchema {
  library: Playlist;
  songs: Record<string, Song>;
  playlists: Record<string, Playlist>;
  playerState: PlayerState | null;
  recentSearches: RecentSearch[];
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
        recentSearches: []
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

  async getRecentSearches(): Promise<RecentSearch[]> {
    return this.store.get('recentSearches') || [];
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    this.store.set('recentSearches', searches);
  }
}
