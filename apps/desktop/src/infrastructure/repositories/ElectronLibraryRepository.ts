import type { Song, Playlist, PlaylistDetail, ImportResult } from '../../../../../packages/types/index';
import type { ILibraryRepository } from '../../../../../packages/core/src/index';

// Declare global types for electronAPI
declare global {
  interface Window {
    electronAPI: {
      getLibrary: () => Promise<{ songs: Song[], library: Playlist }>;
      getPlaylists: () => Promise<Playlist[]>;
      createPlaylist: (name: string) => Promise<Playlist>;
      updatePlaylist: (playlist: Playlist) => Promise<Playlist>;
      updateSong: (song: Song) => Promise<Song>;
      deleteSong: (songId: string) => Promise<boolean>;
      deletePlaylist: (playlistId: string) => Promise<boolean>;
      importFiles: () => Promise<ImportResult>;
      importFolder: () => Promise<ImportResult>;
    }
  }
}

export class ElectronLibraryRepository implements ILibraryRepository {
  async getLibrary(): Promise<{ songs: Song[], library: Playlist }> {
    return window.electronAPI.getLibrary();
  }

  async getPlaylists(): Promise<Playlist[]> {
    return window.electronAPI.getPlaylists();
  }

  async createPlaylist(name: string): Promise<Playlist> {
    return window.electronAPI.createPlaylist(name);
  }

  async updatePlaylist(playlist: Playlist): Promise<Playlist> {
    return window.electronAPI.updatePlaylist(playlist);
  }

  async updateSong(song: Song): Promise<Song> {
    return window.electronAPI.updateSong(song);
  }

  async deleteSong(songId: string): Promise<boolean> {
    return window.electronAPI.deleteSong(songId);
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    return window.electronAPI.deletePlaylist(playlistId);
  }

  async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    const { songs: allSongs, library } = await this.getLibrary();
    const playlists = await this.getPlaylists();
    
    // Check if it's the main library
    if (id === '0') {
      return { ...library, songs: allSongs, songCount: allSongs.length };
    }

    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return null;
    
    const playlistSongs = allSongs.filter(s => playlist.songIds.includes(s.id));
    return { ...playlist, songs: playlistSongs, songCount: playlistSongs.length };
  }

  async importFiles(): Promise<ImportResult> {
    return window.electronAPI.importFiles();
  }

  async importFolder(): Promise<ImportResult> {
    return window.electronAPI.importFolder();
  }
}
