import type { Song, Playlist, PlaylistDetail, DuplicateSongInfo, DuplicateReason } from '@music/types';
import { isSamePath, normalizeString, logger } from '@music/utils';
import type { IStorageAdapter } from '../interfaces/IStorageAdapter';
import type { IMetadataService } from '../interfaces/IMetadataService';
import { Mutex } from '../utils/Mutex';
import path from 'node:path';

// We'll use a simple fallback if crypto.randomUUID is not available (e.g. in some mobile environments)
const generateId = (): string => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
};

export class LibraryService {
  private storageAdapter: IStorageAdapter;
  private metadataService: IMetadataService;
  private mutex = new Mutex();
  private processingPaths = new Set<string>();
  private songs: Song[] = [];

  constructor(storageAdapter: IStorageAdapter, metadataService: IMetadataService) {
    this.storageAdapter = storageAdapter;
    this.metadataService = metadataService;
  }

  /**
   * Absolute Entry Point for single-file imports.
   * Orchestrates metadata extraction and library addition with path-level locking.
   */
  public async importFromPath(filePath: string, caller: string = 'UNKNOWN', sourceUrl?: string, originId?: string): Promise<{
    success: boolean;
    count: number;
    duplicates: string[];
    duplicateSongs: DuplicateSongInfo[];
    reason?: string;
  } | null> {
    const normalizedPath = path.normalize(filePath).toLowerCase();

    // 1. Synchronous Mutex Locking at the absolute entry point
    if (this.processingPaths.has(normalizedPath)) {
      console.warn('\x1b[33m%s\x1b[0m', `🛑 [MUTEX] BLOCKED | Caller: ${caller} | Path: ${normalizedPath}`);
      return null;
    }
    this.processingPaths.add(normalizedPath);
    console.log('\x1b[32m%s\x1b[0m', `🟢 [MUTEX] ACCEPTED | Caller: ${caller} | Path: ${normalizedPath}`);

    try {
      // 2. NOW execute async operations securely
      const songData = await this.metadataService.extract(filePath, sourceUrl, originId);
      if (!songData) {
        return { success: false, count: 0, duplicates: [], duplicateSongs: [], reason: 'METADATA_ERROR' };
      }

      const { addedCount, duplicatePaths, duplicateSongs } = await this.processAndAddSongs([songData]);
      
      return {
        success: true,
        count: addedCount,
        duplicates: duplicatePaths,
        duplicateSongs: duplicateSongs,
        reason: duplicateSongs.length > 0 ? (duplicateSongs[0] as DuplicateSongInfo).duplicateReason : undefined
      };
    } finally {
      // 3. RELEASE LOCK with 5-second Cooldown
      // This allows the Mutex to ignore delayed file watcher events firing after an IPC import
      setTimeout(() => {
        this.processingPaths.delete(normalizedPath);
      }, 5000);
    }
  }

  /**
   * Orchestrates the addition of new songs by reading current state from the adapter,
   * checking for duplicates, and saving the updated state back via the adapter.
   * 
   * Priority 1: File Path match
   * Priority 2: File Content Hash match
   * Priority 3: Title + Artist match
   */
  public async processAndAddSongs(newSongs: Song[]): Promise<{ addedCount: number; duplicatePaths: string[]; duplicateSongs: DuplicateSongInfo[] }> {
    return await this.mutex.runExclusive(async () => {
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
      const existingHashes = new Set(
        existingSongs
          .map(s => s.hash?.split('-')[0])
          .filter(h => h && !h.startsWith('error'))
      );
      const existingSourceUrls = new Set(existingSongs.map(s => s.sourceUrl).filter(Boolean));
      
      // Priority 3: Title + Artist (Guard 3)
      const existingNameArtistKeys = new Set(
        existingSongs.map(s => `${normalizeString(s.title)}|${normalizeString(s.artist)}`)
      );

      const duplicatePaths: string[] = [];
      const duplicateSongs: DuplicateSongInfo[] = [];
      let addedCount = 0;

      logger.info('[Library] Starting processAndAddSongs', { newSongCount: newSongs.length });

      for (const song of newSongs) {
        logger.debug('[Library] Processing song hash / metadata', { filePath: song.filePath, hash: song.hash, title: song.title, artist: song.artist });

        const normTitle = normalizeString(song.title);
        const normArtist = normalizeString(song.artist);
        const nameArtistKey = `${normTitle}|${normArtist}`;

        // 0. SELF-MATCH GUARD (Constraint 2: No ignore, Mandatory update)
        // If we find an existing record with the exact same path, we UPDATE it.
        // This solves the race condition where FFmpeg modifies the file after initial import.
        let selfMatch: Song | undefined;
        for (const existing of existingSongs) {
          if (isSamePath(existing.filePath, song.filePath)) {
            selfMatch = existing;
            break;
          }
        }

        if (selfMatch) {
          logger.info('[Library] Self-Match Check: MATCHED', { isSelfMatch: true, newPath: song.filePath, existingPath: selfMatch.filePath });
          logger.info(`[Library] Self-Match detected: Updating metadata for ${song.filePath}`);
          // Merge new metadata into existing record. We keep the original ID.
          // This ensures the second pass (with FFmpeg tags) persists into the DB.
          songs[selfMatch.id] = { 
            ...selfMatch, 
            ...song, 
            id: selfMatch.id,
            filePath: selfMatch.filePath // Keep normalized/original path reference
          };
          addedCount++; // Counted as "processed successfully"
          logger.info('[Library] Final Action: UPDATED (Self-Match)', { path: song.filePath });
          continue;
        } else {
           logger.info('[Library] Self-Match Check: NOT MATCHED', { isSelfMatch: false, newPath: song.filePath });
        }

        // Check Prioritized mức độ (Priority levels)
        const isDuplicateUrl = song.sourceUrl && existingSourceUrls.has(song.sourceUrl);
        // Priority 2: File Content Hash (Perceptual)
        let isDuplicateHash = false;
        let normalizedHash: string | undefined;

        // STRICT CODE RULE: If a hash starts with error-fallback, it MUST be treated as a unique entity
        // and NEVER collide with another hash (since they represent processing failures).
        const isErrorHash = song.hash?.startsWith('error-fallback');
        if (isErrorHash) {
          isDuplicateHash = false; // NEVER collide on error fallbacks
          logger.warn('[Library] Bypassing duplicate hash check for error fallback', { path: song.filePath, hash: song.hash });
        } else {
          normalizedHash = song.hash?.split('-')[0];
          
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
        }

        const isDuplicatePath = existingPaths.has(song.filePath);
        
        // Guard 3: Strict check for empty metadata to prevent false collisions
        let isDuplicateMetadata = false;
        if (normTitle !== '' || normArtist !== '') {
          isDuplicateMetadata = existingNameArtistKeys.has(nameArtistKey);
        }

        let duplicateReason: DuplicateReason | undefined;
        let collidingSong: Song | undefined;

        if (isDuplicateUrl) {
          duplicateReason = 'URL';
          collidingSong = existingSongs.find(s => s.sourceUrl === song.sourceUrl);
        } else if (isDuplicatePath) {
          duplicateReason = 'PATH';
          collidingSong = existingSongs.find(s => isSamePath(s.filePath, song.filePath));
        } else if (isDuplicateHash) {
          duplicateReason = 'HASH';
          // Find the song that caused the hash collision (perceptual or strict)
          if (normalizedHash?.startsWith('p2:')) {
            const hashContent = normalizedHash.slice(3);
            for (const existing of existingSongs) {
              const existingHash = existing.hash?.split('-')[0];
              if (!existingHash || !existingHash.startsWith('p2:')) continue;
              const similarity = this.calculateSimilarity(hashContent, existingHash.slice(3));
              const durationDiff = Math.abs((song.duration || 0) - (existing.duration || 0));
              if (similarity >= 0.95 || (similarity >= 0.75 && durationDiff < 0.5)) {
                collidingSong = existing;
                break;
              }
            }
          } else {
            collidingSong = existingSongs.find(s => s.hash?.split('-')[0] === normalizedHash);
          }
        } else if (isDuplicateMetadata) {
          duplicateReason = 'METADATA';
          collidingSong = existingSongs.find(s => `${normalizeString(s.title)}|${normalizeString(s.artist)}` === nameArtistKey);
        }

        if (duplicateReason) {
          console.error('\x1b[41m%s\x1b[0m', `❌ [GUARD 3] COLLISION! Reason: ${duplicateReason}`);
          console.error('New:', { path: song.filePath, hash: song.hash, title: song.title, artist: song.artist });
          console.error('Existing:', { 
            id: collidingSong?.id,
            path: collidingSong?.filePath, 
            hash: collidingSong?.hash,
            title: collidingSong?.title, 
            artist: collidingSong?.artist 
          });

          duplicatePaths.push(song.filePath);
          // Return only essential info to avoid IPC overhead (exclude heavy fields like coverArt)
          duplicateSongs.push({
            ...song,
            duplicateReason
          });
          continue;
        }

        // Update our temporary sets to catch duplicates within the SAME batch
        existingPaths.add(song.filePath);
        if (song.hash) existingHashes.add(song.hash);
        if (song.sourceUrl) existingSourceUrls.add(song.sourceUrl);
        existingNameArtistKeys.add(nameArtistKey);

        // If no duplicates and no self-match, it's a new song
        const newSongData = {
          ...song,
          id: generateId(),
          createdAt: new Date().toISOString()
        };
        songs[newSongData.id] = newSongData;
        libraryUpdate.songIds.push(newSongData.id);
        addedCount++;
        logger.info('[Library] Final Action: ADDED', { path: song.filePath });
      }

      // Save back using the adapter
      if (addedCount > 0) {
        await this.storageAdapter.saveSongs(songs);
        await this.storageAdapter.saveLibrary(libraryUpdate);
      }

      return { addedCount, duplicatePaths, duplicateSongs };
    });
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
    return await this.mutex.runExclusive(async () => {
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
    });
  }

  /**
   * Updates an existing playlist.
   */
  public async updatePlaylist(updatedPlaylist: Playlist): Promise<Playlist> {
    return await this.mutex.runExclusive(async () => {
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
    });
  }

  /**
   * Updates an existing song's metadata.
   */
  public async updateSong(updatedSong: Song): Promise<Song> {
    return await this.mutex.runExclusive(async () => {
      const songs = await this.storageAdapter.getSongs();
      songs[updatedSong.id] = updatedSong;
      await this.storageAdapter.saveSongs(songs);
      return updatedSong;
    });
  }

  /**
   * Deletes a song from the library and all playlists.
   */
  public async deleteSong(songId: string): Promise<boolean> {
    return await this.mutex.runExclusive(async () => {
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
    });
  }

  /**
   * Deletes multiple songs from the library and all playlists.
   */
  public async deleteSongs(songIds: string[]): Promise<boolean> {
    return await this.mutex.runExclusive(async () => {
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
    });
  }

  /**
   * Adds multiple songs directly to the library.
   * Useful for manual additions or cases where de-duplication has already been handled.
   */
  public async addSongs(songsToAdd: Song[]): Promise<{ success: boolean; count: number }> {
    return await this.mutex.runExclusive(async () => {
      const currentSongs = await this.storageAdapter.getSongs();
      const library = await this.storageAdapter.getLibrary();
      
      let addedCount = 0;
      for (const song of songsToAdd) {
        currentSongs[song.id] = song;
        if (!library.songIds.includes(song.id)) {
          library.songIds.push(song.id);
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        await this.storageAdapter.saveSongs(currentSongs);
        await this.storageAdapter.saveLibrary(library);
      }
      
      return { success: true, count: addedCount };
    });
  }

  /**
   * Removes multiple songs from a specific playlist.
   */
  public async removeSongsFromPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    return await this.mutex.runExclusive(async () => {
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
    });
  }

  /**
   * Adds multiple songs to a specific playlist, avoiding duplicates.
   */
  public async addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<boolean> {
    return await this.mutex.runExclusive(async () => {
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
    });
  }

  /**
   * Deletes a playlist by ID.
   */
  public async deletePlaylist(playlistId: string): Promise<boolean> {
    return await this.mutex.runExclusive(async () => {
      const playlists = await this.storageAdapter.getPlaylists();
      if (!playlists[playlistId]) return false;

      // Cannot delete the main Library playlist ("0")
      if (playlistId === '0') return false;

      const customPlaylists = { ...playlists };
      delete customPlaylists[playlistId];
      await this.storageAdapter.savePlaylists(customPlaylists);

      return true;
    });
  }

  /**
   * Gets the entire library (Song objects and the main Library playlist).
   */
  public async getLibrary(): Promise<{ songs: Song[]; library: Playlist }> {
    const songs = await this.storageAdapter.getSongs();
    const library = await this.storageAdapter.getLibrary();
    this.songs = Object.values(songs); // Cache the read songs
    return {
      songs: this.songs,
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

  /**
   * Radical Cache Clearing: Purges Service memory and Storage Adapter cache.
   */
  public async clearInternalCache(): Promise<void> {
    this.songs = [];
    this.processingPaths.clear();
    await this.storageAdapter.clear();
    console.log('\x1b[35m%s\x1b[0m', '🧹 [Library] Service Cache Cleared');
  }
}


