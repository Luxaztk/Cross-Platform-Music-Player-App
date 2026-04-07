import type { Song, Playlist, PlaylistDetail } from '@music/types';

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
   * Priority 2: File Content Hash match
   * Priority 3: File Name + Artist match
   */
  public async processAndAddSongs(newSongs: Song[]): Promise<{ addedCount: number; duplicatePaths: string[]; duplicateSongs: (Song & { duplicateReason?: 'URL' | 'HASH' | 'PATH' | 'METADATA' })[] }> {
    const currentSongs = await this.storageAdapter.getSongs();
    const currentLibrary = await this.storageAdapter.getLibrary();

    // Clone purely for immutability and predictability
    const songs = { ...currentSongs };
    const libraryUpdate = {
      ...currentLibrary,
      songIds: [...currentLibrary.songIds]
    };

    const existingSongs = Object.values(songs);

    // Priority 1: File Path
    const existingPaths = new Set(existingSongs.map(s => s.filePath));
    const existingHashes = new Set(existingSongs.map(s => s.hash?.split('-')[0]).filter(Boolean));
    const existingSourceUrls = new Set(existingSongs.map(s => s.sourceUrl).filter(Boolean));
    const existingNameArtistKeys = new Set(
      existingSongs.map(s => `${this.getBaseName(s.filePath).toLowerCase()}|${s.artist.toLowerCase()}`)
    );

    const duplicatePaths: string[] = [];
    const duplicateSongs: Song[] = [];
    let addedCount = 0;

    for (const song of newSongs) {
      const fileName = this.getBaseName(song.filePath).toLowerCase();
      const artist = song.artist.toLowerCase();
      const nameArtistKey = `${fileName}|${artist}`;

      // Check Prioritized mức độ (Priority levels)
      const isDuplicateUrl = song.sourceUrl && existingSourceUrls.has(song.sourceUrl);
      // Priority 2: File Content Hash (Perceptual)
      let isDuplicateHash = false;
      const normalizedHash = song.hash?.split('-')[0];
      
      if (normalizedHash && normalizedHash.startsWith('p2:')) {
        const hashContent = normalizedHash.slice(3);
        
        for (const existing of existingSongs) {
          const existingHash = existing.hash?.split('-')[0];
          if (!existingHash || !existingHash.startsWith('p2:')) continue;
          
          const existingHashContent = existingHash.slice(3);
          const similarity = this.calculateSimilarity(hashContent, existingHashContent);
          
          // Tiered Logic:
          // 1. Strict Match (95% similarity regardless of duration)
          // 2. Smart Match (75% similarity + duration matching < 0.5s)
          const durationDiff = Math.abs((song.duration || 0) - (existing.duration || 0));
          
          if (similarity >= 0.95 || (similarity >= 0.75 && durationDiff < 0.5)) {
            isDuplicateHash = true;
            break;
          }
        }
      } else if (normalizedHash) {
        // Fallback or binary hash (p1:)
        if (existingHashes.has(normalizedHash)) {
          isDuplicateHash = true;
        }
      }

      const isDuplicatePath = existingPaths.has(song.filePath);
      const isDuplicateMetadata = existingNameArtistKeys.has(nameArtistKey);

      let duplicateReason: 'URL' | 'HASH' | 'PATH' | 'METADATA' | undefined;
      if (isDuplicateUrl) duplicateReason = 'URL';
      else if (isDuplicatePath) duplicateReason = 'PATH';
      else if (isDuplicateHash) duplicateReason = 'HASH';
      else if (isDuplicateMetadata) duplicateReason = 'METADATA';

      if (duplicateReason) {
        duplicatePaths.push(song.filePath);
        // Return only essential info to avoid IPC overhead (exclude heavy fields like coverArt)
        duplicateSongs.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          filePath: song.filePath,
          duplicateReason
        } as any);
        continue;
      }

      // Update our temporary sets to catch duplicates within the SAME batch
      existingPaths.add(song.filePath);
      if (song.hash) existingHashes.add(song.hash);
      if (song.sourceUrl) existingSourceUrls.add(song.sourceUrl);
      existingNameArtistKeys.add(nameArtistKey);

      songs[song.id] = song;
      if (!libraryUpdate.songIds.includes(song.id)) {
        libraryUpdate.songIds.push(song.id);
      }
      addedCount++;
    }

    // Save back using the adapter
    if (addedCount > 0) {
      await this.storageAdapter.saveSongs(songs);
      await this.storageAdapter.saveLibrary(libraryUpdate);
    }

    return { addedCount, duplicatePaths, duplicateSongs };
  }

  /**
   * Simple similarity check for fingerprints (0 to 1)
   */
  private calculateSimilarity(h1: string, h2: string): number {
    if (h1.length !== h2.length) return 0;
    let matches = 0;
    for (let i = 0; i < h1.length; i++) {
      if (h1[i] === h2[i]) matches++;
    }
    return matches / h1.length;
  }

  /**
   * Creates a new empty playlist with a default name and unique ID.
   */
  public async createPlaylist(name: string): Promise<Playlist> {
    const playlists = await this.storageAdapter.getPlaylists();

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
    await this.storageAdapter.savePlaylists(customPlaylists);

    return newPlaylist;
  }

  /**
   * Updates an existing playlist.
   */
  public async updatePlaylist(updatedPlaylist: Playlist): Promise<Playlist> {
    const playlists = await this.storageAdapter.getPlaylists();

    // Check if it's the library (cannot edit library name/desc this way usually)
    if (updatedPlaylist.id === '0') {
      await this.storageAdapter.saveLibrary(updatedPlaylist);
      return updatedPlaylist;
    }

    const customPlaylists = { ...playlists };
    delete customPlaylists['0'];

    customPlaylists[updatedPlaylist.id] = updatedPlaylist;
    await this.storageAdapter.savePlaylists(customPlaylists);

    return updatedPlaylist;
  }

  /**
   * Updates an existing song's metadata.
   */
  public async updateSong(updatedSong: Song): Promise<Song> {
    const songs = await this.storageAdapter.getSongs();
    songs[updatedSong.id] = updatedSong;
    await this.storageAdapter.saveSongs(songs);
    return updatedSong;
  }

  /**
   * Deletes a song from the library and all playlists.
   */
  public async deleteSong(songId: string): Promise<boolean> {
    const songs = await this.storageAdapter.getSongs();
    if (!songs[songId]) return false;

    // 1. Remove from songs record
    delete songs[songId];
    await this.storageAdapter.saveSongs(songs);

    // 2. Remove from library songIds
    const library = await this.storageAdapter.getLibrary();
    library.songIds = library.songIds.filter(id => id !== songId);
    await this.storageAdapter.saveLibrary(library);

    // 3. Remove from all playlists
    const playlists = await this.storageAdapter.getPlaylists();
    let updatedPlaylists = false;

    for (const id in playlists) {
      const playlist = playlists[id];
      if (playlist.songIds.includes(songId)) {
        playlist.songIds = playlist.songIds.filter(id => id !== songId);
        updatedPlaylists = true;
      }
    }

    if (updatedPlaylists) {
      await this.storageAdapter.savePlaylists(playlists);
    }

    return true;
  }

  /**
   * Deletes multiple songs from the library and all playlists.
   */
  public async deleteSongs(songIds: string[]): Promise<boolean> {
    if (!songIds || songIds.length === 0) return true;

    const songs = await this.storageAdapter.getSongs();
    const playlists = await this.storageAdapter.getPlaylists();
    const library = await this.storageAdapter.getLibrary();
    let anyDeleted = false;
    let anyPlaylistUpdated = false;

    for (const songId of songIds) {
      if (songs[songId]) {
        delete songs[songId];
        anyDeleted = true;
      }

      // Remove from library songIds
      if (library.songIds.includes(songId)) {
        library.songIds = library.songIds.filter(id => id !== songId);
      }

      // Remove from all playlists
      for (const pId in playlists) {
        const playlist = playlists[pId];
        if (playlist.songIds.includes(songId)) {
          playlist.songIds = playlist.songIds.filter(id => id !== songId);
          anyPlaylistUpdated = true;
        }
      }
    }

    if (anyDeleted) {
      await this.storageAdapter.saveSongs(songs);
      await this.storageAdapter.saveLibrary(library);
      if (anyPlaylistUpdated) {
        await this.storageAdapter.savePlaylists(playlists);
      }
    }

    return anyDeleted;
  }

  /**
   * Removes multiple songs from a specific playlist.
   */
  public async removeSongsFromPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    if (playlistId === '0') return await this.deleteSongs(songIds);

    const playlists = await this.storageAdapter.getPlaylists();
    if (!playlists[playlistId]) return false;

    const playlist = playlists[playlistId];
    const initialCount = playlist.songIds.length;
    
    playlist.songIds = playlist.songIds.filter(id => !songIds.includes(id));
    
    if (playlist.songIds.length !== initialCount) {
      await this.storageAdapter.savePlaylists(playlists);
      return true;
    }

    return false;
  }

  /**
   * Adds multiple songs to a specific playlist, avoiding duplicates.
   */
  public async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    if (playlistId === '0') return false; // Cannot add to library this way (use processAndAddSongs)

    const playlists = await this.storageAdapter.getPlaylists();
    if (!playlists[playlistId]) return false;

    const playlist = playlists[playlistId];
    
    // Add only IDs that are not already present
    const newIds = songIds.filter(id => !playlist.songIds.includes(id));
    
    if (newIds.length > 0) {
      playlist.songIds = [...playlist.songIds, ...newIds];
      await this.storageAdapter.savePlaylists(playlists);
      return true;
    }

    return false;
  }

  /**
   * Deletes a playlist by ID.
   */
  public async deletePlaylist(playlistId: string): Promise<boolean> {
    const playlists = await this.storageAdapter.getPlaylists();
    if (!playlists[playlistId]) return false;

    // Cannot delete the main Library playlist ("0")
    if (playlistId === '0') return false;

    const customPlaylists = { ...playlists };
    delete customPlaylists[playlistId];
    await this.storageAdapter.savePlaylists(customPlaylists);

    return true;
  }

  /**
   * Gets the entire library (Song objects and the main Library playlist).
   */
  public async getLibrary(): Promise<{ songs: Song[]; library: Playlist }> {
    const songs = await this.storageAdapter.getSongs();
    const library = await this.storageAdapter.getLibrary();
    return {
      songs: Object.values(songs),
      library
    };
  }

  /**
   * Gets all playlists including custom ones.
   */
  public async getPlaylists(): Promise<Playlist[]> {
    const playlistsMap = await this.storageAdapter.getPlaylists();
    const playlists = Object.values(playlistsMap);

    // Ensure Library ("0") is always included at the start if available
    const library = await this.storageAdapter.getLibrary();
    return [library, ...playlists];
  }

  /**
   * Gets a playlist by ID with full song details.
   */
  public async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    let playlist: Playlist | null = null;
    if (id === '0') {
      playlist = await this.storageAdapter.getLibrary();
    } else {
      const playlists = await this.storageAdapter.getPlaylists();
      playlist = playlists[id] || null;
    }

    if (!playlist) return null;

    const allSongs = await this.storageAdapter.getSongs();
    const songs = playlist.songIds
      .map(songId => allSongs[songId])
      .filter(song => !!song);

    return {
      ...playlist,
      songs,
      songCount: songs.length
    };
  }
}


