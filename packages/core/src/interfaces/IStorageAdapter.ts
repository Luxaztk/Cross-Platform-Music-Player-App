import type { Song, Playlist } from '@music/types';

export interface IStorageAdapter {
  getSongs(): Record<string, Song>;
  getLibrary(): Playlist;
  getPlaylists(): Record<string, Playlist>;
  saveSongs(songs: Record<string, Song>): void;
  saveLibrary(library: Playlist): void;
  savePlaylists(playlists: Record<string, Playlist>): void;
}
