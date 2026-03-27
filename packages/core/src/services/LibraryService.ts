import type { Song, Playlist } from '@music/types';
import type { IStorageAdapter } from '../interfaces/IStorageAdapter';

// We'll use a simple fallback if crypto.randomUUID is not available (e.g. in some mobile environments)
const generateId = () => {
  try {
    return (globalThis as any).crypto.randomUUID();
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
};

export class LibraryService {
  private storageAdapter: IStorageAdapter;

  constructor(storageAdapter: IStorageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  /**
   * Helper utility to get the base name of a file path without using Node's path module
   */
  private getBaseName(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || '';
  }

  /**
   * Orchestrates the addition of new songs by reading current state from the adapter,
   * checking for duplicates, and saving the updated state back via the adapter.
   * 
   * Priority 1: File Path match
   * Priority 2 & 3: File Name + Artist match
   */
  public processAndAddSongs(newSongs: Song[]): { addedCount: number; duplicatePaths: string[] } {
    const currentSongs = this.storageAdapter.getSongs();
    const currentLibrary = this.storageAdapter.getLibrary();
    
    // Clone purely for immutability and predictability
    const songs = { ...currentSongs };
    const libraryUpdate = { 
      ...currentLibrary, 
      songIds: [...currentLibrary.songIds] 
    };
    
    const existingSongs = Object.values(songs);
    
    // Priority 1: File Path
    const existingPaths = new Set(existingSongs.map(s => s.filePath));
    // Priority 2 & 3: File Name + Artist
    const existingNameArtistKeys = new Set(
      existingSongs.map(s => `${this.getBaseName(s.filePath).toLowerCase()}|${s.artist.toLowerCase()}`)
    );

    const duplicatePaths: string[] = [];
    let addedCount = 0;

    for (const song of newSongs) {
      const fileName = this.getBaseName(song.filePath).toLowerCase();
      const artist = song.artist.toLowerCase();
      const nameArtistKey = `${fileName}|${artist}`;

      // Check Prioritized levels
      if (existingPaths.has(song.filePath) || existingNameArtistKeys.has(nameArtistKey)) {
        duplicatePaths.push(song.filePath);
        continue;
      }
      
      songs[song.id] = song;
      if (!libraryUpdate.songIds.includes(song.id)) {
        libraryUpdate.songIds.push(song.id);
      }
      addedCount++;
    }

    // Save back using the adapter
    this.storageAdapter.saveSongs(songs);
    this.storageAdapter.saveLibrary(libraryUpdate);

    return { addedCount, duplicatePaths };
  }

  /**
   * Creates a new empty playlist with a default name and unique ID.
   */
  public createPlaylist(name: string): Playlist {
    const playlists = this.storageAdapter.getPlaylists();
    
    // Filter out the "0" (Library) playlist if it exists in the keys
    const customPlaylists = { ...playlists };
    delete customPlaylists['0'];

    const id = generateId();
    const newPlaylist: Playlist = {
      id,
      name,
      description: '',
      songIds: [],
      createdAt: new Date().toISOString()
    };

    customPlaylists[id] = newPlaylist;
    this.storageAdapter.savePlaylists(customPlaylists);

    return newPlaylist;
  }

  /**
   * Updates an existing playlist.
   */
  public updatePlaylist(updatedPlaylist: Playlist): Playlist {
    const playlists = this.storageAdapter.getPlaylists();
    
    // Check if it's the library (cannot edit library name/desc this way usually)
    if (updatedPlaylist.id === '0') {
      this.storageAdapter.saveLibrary(updatedPlaylist);
      return updatedPlaylist;
    }

    const customPlaylists = { ...playlists };
    delete customPlaylists['0'];
    
    customPlaylists[updatedPlaylist.id] = updatedPlaylist;
    this.storageAdapter.savePlaylists(customPlaylists);

    return updatedPlaylist;
  }

  /**
   * Updates an existing song's metadata.
   */
  public updateSong(updatedSong: Song): Song {
    const songs = this.storageAdapter.getSongs();
    songs[updatedSong.id] = updatedSong;
    this.storageAdapter.saveSongs(songs);
    return updatedSong;
  }

  /**
   * Deletes a song from the library and all playlists.
   */
  public deleteSong(songId: string): boolean {
    const songs = this.storageAdapter.getSongs();
    if (!songs[songId]) return false;

    // 1. Remove from songs record
    delete songs[songId];
    this.storageAdapter.saveSongs(songs);

    // 2. Remove from library songIds
    const library = this.storageAdapter.getLibrary();
    library.songIds = library.songIds.filter(id => id !== songId);
    this.storageAdapter.saveLibrary(library);

    // 3. Remove from all playlists
    const playlists = this.storageAdapter.getPlaylists();
    let updatedPlaylists = false;
    
    for (const id in playlists) {
      const playlist = playlists[id];
      if (playlist.songIds.includes(songId)) {
        playlist.songIds = playlist.songIds.filter(id => id !== songId);
        updatedPlaylists = true;
      }
    }

    if (updatedPlaylists) {
      this.storageAdapter.savePlaylists(playlists);
    }

    return true;
  }

  /**
   * Deletes a playlist by ID.
   */
  public deletePlaylist(playlistId: string): boolean {
    const playlists = this.storageAdapter.getPlaylists();
    if (!playlists[playlistId]) return false;

    // Cannot delete the main Library playlist ("0")
    if (playlistId === '0') return false;

    const customPlaylists = { ...playlists };
    delete customPlaylists[playlistId];
    this.storageAdapter.savePlaylists(customPlaylists);

    return true;
  }
}
