import { Song, Playlist, PlaylistDetail, ImportResult, SyncHistoryEntry, SyncStats } from '@music/types';
import { ILibraryRepository, LibraryService } from '@music/core';
import { MobileStorageAdapter } from '../services/MobileStorageAdapter';

export class MobileLibraryRepository implements ILibraryRepository {
  private service: LibraryService;

  constructor() {
    const storage = new MobileStorageAdapter();
    const mockMetadataService = {
      extract: async () => null,
      exists: async () => true,
    };
    this.service = new LibraryService(storage, mockMetadataService as any);
  }

  async getLibrary(): Promise<{ songs: Song[], library: Playlist }> {
    return await this.service.getLibrary();
  }

  async getPlaylists(): Promise<Playlist[]> {
    return await this.service.getPlaylists();
  }

  async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    return await this.service.getPlaylistById(id);
  }



  async createPlaylist(name: string): Promise<Playlist> {
    return await this.service.createPlaylist(name);
  }

  async updatePlaylist(playlist: Playlist): Promise<Playlist> {
    return await this.service.updatePlaylist(playlist);
  }

  async updateSong(song: Song): Promise<Song> {
    return await this.service.updateSong(song);
  }

  async deleteSong(songId: string): Promise<boolean> {
    return await this.service.deleteSong(songId);
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    return await this.service.deletePlaylist(playlistId);
  }

  async deleteSongs(songIds: string[]): Promise<boolean> {
    return await this.service.deleteSongs(songIds);
  }

  async removeSongsFromPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    return await this.service.removeSongsFromPlaylist(playlistId, songIds);
  }

  async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    return await this.service.addSongsToPlaylist(playlistId, songIds);
  }

  async importFiles(): Promise<ImportResult> {
    // Note: This would involve react-native-document-picker or similar
    // For now we keep the interface as is
    return { success: false, count: 0, reason: 'ERROR', message: 'Not implemented on mobile yet' };
  }

  async importFolder(): Promise<ImportResult> {
    return { success: false, count: 0, reason: 'ERROR', message: 'Not implemented on mobile yet' };
  }

  async addSongs(songs: Song[]): Promise<{ success: boolean; count: number }> {
    return await this.service.addSongs(songs);
  }

  async scanMissingFiles(): Promise<Song[]> {
    // Not applicable on mobile in this simple version
    return [];
  }

  async runAutoImportScan(_paths: string[]): Promise<{ added: number; migrated: number; totalScanned: number; details: string[] }> {
    return { added: 0, migrated: 0, totalScanned: 0, details: [] };
  }

  async patchSong(songId: string, updates: Partial<Song>): Promise<Song | null> {
    return await this.service.patchSong(songId, updates);
  }

  async getSettings(): Promise<any> {
    return {};
  }

  async getLyrics(songId: string): Promise<string | null> {
    const song = (await this.getLibrary()).songs.find(s => s.id === songId);
    return song?.syncedLyrics || song?.lyrics || null;
  }

  async saveLyrics(_songId: string, _lyrics: string, _lyricId?: number): Promise<boolean> {
    return false; // Not implemented on mobile yet
  }

  async searchLyrics(_query: string): Promise<any[]> {
    return []; // Not implemented on mobile yet
  }

  async getSyncHistory(): Promise<SyncHistoryEntry[]> {
    return [];
  }

  async clearSyncHistory(): Promise<void> {
    // No-op
  }

  async logSyncEvent(_stats: SyncStats, _details: string[]): Promise<void> {
    // No-op
  }
}
