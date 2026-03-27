import Store from 'electron-store';
import type { Song, Playlist } from '@music/types';
import type { IStorageAdapter } from '../../../../../packages/core/src/index';

interface StoreSchema {
  library: Playlist;
  songs: Record<string, Song>;
  playlists: Record<string, Playlist>;
}

export class ElectronStorageAdapter implements IStorageAdapter {
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
        playlists: {}
      }
    });
  }

  getLibrary(): Playlist {
    return this.store.get('library');
  }

  getSongs(): Record<string, Song> {
    return this.store.get('songs');
  }

  saveSongs(songs: Record<string, Song>): void {
    this.store.set('songs', songs);
  }

  saveLibrary(library: Playlist): void {
    this.store.set('library', library);
  }

  savePlaylists(playlists: Record<string, Playlist>): void {
    this.store.set('playlists', playlists);
  }

  getPlaylists(): Record<string, Playlist> {
    const playlists = this.store.get('playlists') || {};
    const library = this.getLibrary();
    return { '0': library, ...playlists };
  }

  getSongList(): Song[] {
    const songs = this.getSongs();
    return Object.values(songs);
  }
}
