import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';
import type { IStorageAdapter } from '@music/core';

export class ElectronStorageAdapter implements IStorageAdapter {
  async getLibrary(): Promise<Playlist> {
    return window.electronAPI.getLibraryData();
  }

  async getSongs(): Promise<Record<string, Song>> {
    return window.electronAPI.getSongsData();
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    await window.electronAPI.saveSongsData(songs);
  }

  async saveLibrary(library: Playlist): Promise<void> {
    await window.electronAPI.saveLibraryData(library);
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    await window.electronAPI.savePlaylistsData(playlists);
  }

  async getPlaylists(): Promise<Record<string, Playlist>> {
    return window.electronAPI.getPlaylistsData();
  }

  async getPlayerState(): Promise<PlayerState | null> {
    return window.electronAPI.getPlayerState();
  }

  async savePlayerState(state: PlayerState): Promise<void> {
    await window.electronAPI.savePlayerState(state);
  }

  async getSongList(): Promise<Song[]> {
    const songs = await this.getSongs();
    return Object.values(songs);
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    return window.electronAPI.getRecentSearches();
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    await window.electronAPI.saveRecentSearches(searches);
  }
}
