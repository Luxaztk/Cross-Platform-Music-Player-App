import * as DocumentPicker from 'expo-document-picker';
import { MobileStorageAdapter } from '../storage/MobileStorageAdapter';
import { importPickedAudioAssets } from './importAudio';
import type { ILibraryRepository } from '@music/core';
import type { Song, Playlist, PlaylistDetail, ImportResult, LyricSearchResult, SyncHistoryEntry, SyncStats } from '@music/types';

export class MobileLibraryRepository implements ILibraryRepository {
  private storage: MobileStorageAdapter;

  constructor(storage: MobileStorageAdapter) {
    this.storage = storage;
  }

  async getLibrary(): Promise<{ songs: Song[]; library: Playlist }> {
    const [songsRecord, library] = await Promise.all([
      this.storage.getSongs(),
      this.storage.getLibrary(),
    ]);
    return { songs: Object.values(songsRecord), library };
  }

  async getPlaylists(): Promise<Playlist[]> {
    const playlistsRecord = await this.storage.getPlaylists();
    return Object.values(playlistsRecord);
  }

  async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    const playlists = await this.storage.getPlaylists();
    const playlist = playlists[id];
    if (!playlist) return null;
    
    const songsRecord = await this.storage.getSongs();
    const songs = playlist.songIds.map(sid => songsRecord[sid]).filter(Boolean);
    return { ...playlist, songs, songCount: songs.length };
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const playlists = await this.storage.getPlaylists();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const newPlaylist: Playlist = {
      id,
      name: name.trim(),
      description: '',
      songIds: [],
      createdAt: new Date().toISOString(),
    };
    playlists[id] = newPlaylist;
    await this.storage.savePlaylists(playlists);
    return newPlaylist;
  }

  async updatePlaylist(playlist: Playlist): Promise<Playlist> {
    const playlists = await this.storage.getPlaylists();
    playlists[playlist.id] = playlist;
    await this.storage.savePlaylists(playlists);
    return playlist;
  }

  async updateSong(song: Song): Promise<Song> {
    const songs = await this.storage.getSongs();
    songs[song.id] = song;
    await this.storage.saveSongs(songs);
    return song;
  }

  async deleteSong(songId: string): Promise<boolean> {
    return this.deleteSongs([songId]);
  }

  async deleteSongs(songIds: string[]): Promise<boolean> {
    const songs = await this.storage.getSongs();
    const library = await this.storage.getLibrary();
    const playlists = await this.storage.getPlaylists();

    for (const id of songIds) {
      delete songs[id];
    }
    
    library.songIds = library.songIds.filter(id => !songIds.includes(id));
    
    for (const pid in playlists) {
      playlists[pid].songIds = playlists[pid].songIds.filter(id => !songIds.includes(id));
    }

    await Promise.all([
      this.storage.saveSongs(songs),
      this.storage.saveLibrary(library),
      this.storage.savePlaylists(playlists),
    ]);
    return true;
  }

  async removeSongsFromPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    const playlists = await this.storage.getPlaylists();
    const playlist = playlists[playlistId];
    if (!playlist) return false;

    playlist.songIds = playlist.songIds.filter(id => !songIds.includes(id));
    await this.storage.savePlaylists(playlists);
    return true;
  }

  async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    const playlists = await this.storage.getPlaylists();
    const playlist = playlists[playlistId];
    if (!playlist) return false;

    for (const id of songIds) {
      if (!playlist.songIds.includes(id)) {
        playlist.songIds.push(id);
      }
    }
    await this.storage.savePlaylists(playlists);
    return true;
  }

  async deletePlaylist(playlistId: string): Promise<boolean> {
    if (playlistId === '0') return false;
    const playlists = await this.storage.getPlaylists();
    delete playlists[playlistId];
    await this.storage.savePlaylists(playlists);
    return true;
  }

  async importFiles(): Promise<ImportResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets) {
        return { success: false, count: 0 };
      }

      const songsRecord = await this.storage.getSongs();
      const existingSourceUris = new Set(
        Object.values(songsRecord)
          .map((s) => s.sourceUrl)
          .filter((u): u is string => !!u)
      );

      const { songs: importedSongs, skippedDuplicates } = await importPickedAudioAssets(result.assets, {
        existingSourceUris,
      });

      if (importedSongs.length > 0) {
        const nextSongsById = { ...songsRecord };
        for (const s of importedSongs) {
          nextSongsById[s.id] = s;
        }

        const library = await this.storage.getLibrary();
        const nextLibrary: Playlist = {
          ...library,
          songIds: [...library.songIds],
        };

        for (const s of importedSongs) {
          if (!nextLibrary.songIds.includes(s.id)) {
            nextLibrary.songIds.push(s.id);
          }
        }

        await Promise.all([
          this.storage.saveSongs(nextSongsById),
          this.storage.saveLibrary(nextLibrary),
        ]);
      }

      return {
        success: true,
        count: importedSongs.length,
        // duplicateSongs: [] // Add details if needed
      };
    } catch (err) {
      console.error('Failed to import files:', err);
      return { success: false, count: 0 };
    }
  }

  async importFolder(): Promise<ImportResult> {
    // expo-document-picker doesn't support folder selection well, fallback to files
    return this.importFiles();
  }

  async addSongs(songsToAdd: Song[]): Promise<{ success: boolean; count: number }> {
    const songsRecord = await this.storage.getSongs();
    const library = await this.storage.getLibrary();

    for (const s of songsToAdd) {
      songsRecord[s.id] = s;
      if (!library.songIds.includes(s.id)) {
        library.songIds.push(s.id);
      }
    }

    await Promise.all([
      this.storage.saveSongs(songsRecord),
      this.storage.saveLibrary(library),
    ]);
    return { success: true, count: songsToAdd.length };
  }

  async scanMissingFiles(): Promise<Song[]> {
    return []; // Not implemented for mobile MVP
  }

  async runAutoImportScan(paths: string[]): Promise<{ added: number; migrated: number; totalScanned: number; details: string[] }> {
    return { added: 0, migrated: 0, totalScanned: 0, details: [] };
  }

  async getLyrics(songId: string): Promise<string | null> {
    return null;
  }

  async saveLyrics(songId: string, lyrics: string, lyricId?: number): Promise<boolean> {
    return false;
  }

  async searchLyrics(query: string): Promise<LyricSearchResult[]> {
    return [];
  }

  async patchSong(songId: string, updates: Partial<Song>): Promise<Song | null> {
    return this.storage.patchSong(songId, updates);
  }

  async getSettings(): Promise<unknown> {
    return {};
  }

  async getSyncHistory(): Promise<SyncHistoryEntry[]> {
    return [];
  }

  async clearSyncHistory(): Promise<void> {}

  async logSyncEvent(stats: SyncStats, details: string[]): Promise<void> {}
}
