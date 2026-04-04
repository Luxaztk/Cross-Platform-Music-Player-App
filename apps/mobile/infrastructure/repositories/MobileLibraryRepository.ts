import { Song, Playlist, PlaylistDetail, ImportResult } from '@music/types';
import { ILibraryRepository, LibraryService } from '@music/core';
import { MobileStorageAdapter } from '../services/MobileStorageAdapter';

export class MobileLibraryRepository implements ILibraryRepository {
  private service: LibraryService;

  constructor() {
    const storage = new MobileStorageAdapter();
    this.service = new LibraryService(storage);
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

  async importFiles(): Promise<ImportResult> {
    // Note: This would involve react-native-document-picker or similar
    // For now we keep the interface as is
    return { success: false, count: 0, reason: 'ERROR', message: 'Not implemented on mobile yet' };
  }

  async importFolder(): Promise<ImportResult> {
    return { success: false, count: 0, reason: 'ERROR', message: 'Not implemented on mobile yet' };
  }
}
