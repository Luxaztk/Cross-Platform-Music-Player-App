import type { Song, Playlist, PlayerState } from '@music/types';

export interface IStorageAdapter {
  getSongs(): Promise<Record<string, Song>>;
  getLibrary(): Promise<Playlist>;
  getPlaylists(): Promise<Record<string, Playlist>>;
  saveSongs(songs: Record<string, Song>): Promise<void>;
  saveLibrary(library: Playlist): Promise<void>;
  savePlaylists(playlists: Record<string, Playlist>): Promise<void>;
  getPlayerState(): Promise<PlayerState | null>;
  savePlayerState(state: PlayerState): Promise<void>;
}
