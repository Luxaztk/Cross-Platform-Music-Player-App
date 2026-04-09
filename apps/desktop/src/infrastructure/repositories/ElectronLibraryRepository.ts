import type {
  Song,
  Playlist,
  PlaylistDetail,
  ImportResult,
  LyricSearchResult
} from '@music/types';
import type { ILibraryRepository } from '@music/core';

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

  async deleteSongs(songIds: string[]): Promise<boolean> {
    return window.electronAPI.deleteSongs(songIds);
  }

  async removeSongsFromPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    return window.electronAPI.removeSongsFromPlaylist(playlistId, songIds);
  }

  async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    return window.electronAPI.addSongsToPlaylist(playlistId, songIds);
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    return window.electronAPI.deletePlaylist(playlistId);
  }

  /**
   * Tối ưu hóa việc lấy chi tiết Playlist
   */
  async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    // 1. Chạy song song các request để giảm thời gian chờ (Latency)
    const [libData, playlists] = await Promise.all([
      this.getLibrary(),
      this.getPlaylists()
    ]);

    const { songs: allSongs, library } = libData;

    // Trường hợp lấy Library (Playlist mặc định)
    if (id === '0' || id === library.id) {
      return {
        ...library,
        songs: allSongs,
        songCount: allSongs.length
      };
    }

    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return null;

    // 2. Sử dụng Set để tối ưu việc tìm kiếm songId (O(1) thay vì O(n))
    const songIdSet = new Set(playlist.songIds);
    const playlistSongs = allSongs.filter(s => songIdSet.has(s.id));

    return {
      ...playlist,
      songs: playlistSongs,
      songCount: playlistSongs.length
    };
  }

  async importFiles(): Promise<ImportResult> {
    return window.electronAPI.importFiles();
  }

  async importFolder(): Promise<ImportResult> {
    return window.electronAPI.importFolder();
  }

  async addSongs(songs: Song[]): Promise<{ success: boolean; count: number }> {
    return window.electronAPI.addSongs(songs);
  }

  async scanMissingFiles(): Promise<string[]> {
    return window.electronAPI.scanMissingFiles();
  }

  async getLyrics(songId: string): Promise<string | null> {
    return window.electronAPI.getLyrics(songId);
  }

  async saveLyrics(songId: string, lyrics: string, lyricId?: number): Promise<boolean> {
    return window.electronAPI.saveLyrics(songId, lyrics, lyricId);
  }

  // FIX: Loại bỏ any, dùng LyricSearchResult chuẩn
  async searchLyrics(query: string): Promise<LyricSearchResult[]> {
    return window.electronAPI.searchLyrics(query);
  }
}