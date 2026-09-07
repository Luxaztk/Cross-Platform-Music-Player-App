import type { Song, Playlist, PlaylistDetail, DuplicateSongInfo, DuplicateReason } from '@music/types';
import { isSamePath, normalizeString, logger } from '@music/utils';
import { getCanonicalYoutubeUrl } from '../utils/youtube';
import type { IStorageAdapter } from '../interfaces/IStorageAdapter';
import type { IMetadataService } from '../interfaces/IMetadataService';
import { Mutex } from '../utils/Mutex';

type EventCallback = (...args: unknown[]) => void;

class SimpleEventEmitter {
  private listeners: Record<string, EventCallback[]> = {};
  on(event: string, fn: EventCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  emit(event: string, ...args: unknown[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(...args));
    }
  }
}

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
  public events = new SimpleEventEmitter();

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
    const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/+$/, '').toLowerCase();

    // 1. Synchronous Mutex Locking at the absolute entry point
    if (this.processingPaths.has(normalizedPath)) {
      console.warn('\x1b[33m%s\x1b[0m', `🛑 [MUTEX] BLOCKED | Caller: ${caller} | Path: ${normalizedPath}`);
      return null;
    }
    this.processingPaths.add(normalizedPath);
    console.log('\x1b[32m%s\x1b[0m', `🟢 [MUTEX] ACCEPTED | Caller: ${caller} | Path: ${normalizedPath}`);

    try {
      // 2. NOW execute async operations securely
      const cleanSourceUrl = sourceUrl ? getCanonicalYoutubeUrl(sourceUrl) || sourceUrl : sourceUrl;
      const songData = await this.metadataService.extract(filePath, cleanSourceUrl, originId);
      if (!songData) {
        return { success: false, count: 0, duplicates: [], duplicateSongs: [], reason: 'METADATA_ERROR' };
      }

      const { addedCount, migratedCount, duplicatePaths, duplicateSongs } = await this.processAndAddSongs([songData]);
      
      if (migratedCount > 0) {
        logger.info(`[Library] importFromPath: Relinked ${migratedCount} moved files`);
      }
      
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
  public async processAndAddSongs(newSongs: Song[]): Promise<{
    addedCount: number;
    migratedCount: number;
    duplicatePaths: string[];
    duplicateSongs: DuplicateSongInfo[];
    details: string[];
  }> {
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
      const existingSourceUrls = new Set(
        existingSongs
          .map(s => s.sourceUrl ? getCanonicalYoutubeUrl(s.sourceUrl) || s.sourceUrl : null)
          .filter((url): url is string => url !== null)
      );
      
      const existingHashes = new Set(
        existingSongs
          .map(s => s.hash)
          .filter(h => h && !h.startsWith('error-fallback'))
      );
      
      // Priority 3: Title + Artist (Guard 3)
      const existingNameArtistKeys = new Set(
        existingSongs.map(s => `${normalizeString(s.title)}|${normalizeString(s.artist)}`)
      );

      const duplicatePaths: string[] = [];
      const duplicateSongs: DuplicateSongInfo[] = [];
      let addedCount = 0;
      let migratedCount = 0;
      const details: string[] = [];
      const newSongTitles: string[] = [];

      logger.info('[Library] Starting processAndAddSongs', { newSongCount: newSongs.length });

      for (let index = 0; index < newSongs.length; index++) {
        const song = newSongs[index];
        try {
          logger.debug('[Library] Processing song hash / metadata', { filePath: song.filePath, hash: song.hash, title: song.title, artist: song.artist });

        const normTitle = normalizeString(song.title);
        const normArtist = normalizeString(song.artist);
        const nameArtistKey = `${normTitle}|${normArtist}`;

        // Normalize URL before check/save
        if (song.sourceUrl) {
          song.sourceUrl = getCanonicalYoutubeUrl(song.sourceUrl) || song.sourceUrl;
        }

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

        // 🛡️ GUARD 2: Đối chiếu Vân tay âm thanh (Audio Hash) - BẢN TỐI ƯU HIỆU NĂNG CAO
        let isDuplicateHash = false;
        const isErrorHash = song.hash?.startsWith('error-fallback');

        if (!isErrorHash && song.hash?.startsWith('p2:')) {
          const hashContent = song.hash.slice(3);

          for (const existing of existingSongs) {
            const existingHash = existing.hash?.startsWith('p2:') ? existing.hash.slice(3) : null;
            if (!existingHash) continue;

            // 🚀 BỘ LỌC 1: LỌC THỜI LƯỢNG (O(1) - Siêu nhanh)
            // Tolerate 5% duration difference, up to a maximum of 60 seconds (min 3s).
            // Giúp loại trừ ngay 90-95% thư viện tùy vào độ dài track.
            const maxTolerance = Math.max(3.0, Math.min(60.0, (existing.duration || 0) * 0.05));
            const durationDiff = Math.abs((song.duration || 0) - (existing.duration || 0));
            if (durationDiff > maxTolerance) continue;

            // 🚀 BỘ LỌC 2: TRƯỢT TÌM CHÍNH XÁC (Narrow Phase - Tốn CPU)
            // Hàm calculateSimilarity (Sliding Window) handles temporal shifts and compression jitter.
            const similarity = this.calculateSimilarity(hashContent, existingHash);

            // Ngưỡng an toàn khi đã dùng thuật toán trượt. Dùng logic 85% và 70% + 1.0s diff.
            if (similarity >= 0.85 || (similarity >= 0.70 && durationDiff < 1.0)) {
              isDuplicateHash = true;
              break;
            }
          }
        } else if (!isErrorHash && song.hash) {
          // Fallback or binary hash (legacy support)
          if (existingHashes.has(song.hash)) {
            isDuplicateHash = true;
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
          collidingSong = existingSongs.find(s => {
            if (!s.sourceUrl) return false;
            const normalizedExisting = getCanonicalYoutubeUrl(s.sourceUrl) || s.sourceUrl;
            return normalizedExisting === song.sourceUrl;
          });
        } else if (isDuplicatePath) {
          duplicateReason = 'PATH';
          collidingSong = existingSongs.find(s => isSamePath(s.filePath, song.filePath));
        } else if (isDuplicateHash) {
          duplicateReason = 'HASH';
          // Find the song that caused the hash collision
          if (!isErrorHash && song.hash?.startsWith('p2:')) {
             const hashContent = song.hash.slice(3);
             for (const existing of existingSongs) {
               const existingHash = existing.hash?.startsWith('p2:') ? existing.hash.slice(3) : null;
               if (!existingHash) continue;
               
               const maxTolerance = Math.max(3.0, Math.min(60.0, (existing.duration || 0) * 0.05));
               const durationDiff = Math.abs((song.duration || 0) - (existing.duration || 0));
               if (durationDiff > maxTolerance) continue;
               
               const similarity = this.calculateSimilarity(hashContent, existingHash);
               if (similarity >= 0.85 || (similarity >= 0.70 && durationDiff < 1.0)) {
                 collidingSong = existing;
                 break;
               }
             }
          } else if (!isErrorHash && song.hash) {
            collidingSong = existingSongs.find(s => s.hash === song.hash);
          }
        } else if (isDuplicateMetadata) {
          duplicateReason = 'METADATA';
          collidingSong = existingSongs.find(s => `${normalizeString(s.title)}|${normalizeString(s.artist)}` === nameArtistKey);
        }

        if (duplicateReason && collidingSong) {
          // [RELINK LOGIC] Critical Fix: If any collision is detected (URL, Hash, or Metadata),
          // we check if the original file still exists. If the old file is MISSING, 
          // we MIGRATE the record to the new path instead of skipping.
          const exists = await this.metadataService.exists(collidingSong.filePath);
          
          if (!exists) {
            logger.info('[Library] Path Migration Triggered', { 
              reason: duplicateReason,
              oldPath: collidingSong.filePath, 
              newPath: song.filePath,
              songId: collidingSong.id
            });
            
            // Merge new metadata into existing record while preserving ID and core fields
            songs[collidingSong.id] = {
              ...collidingSong,
              ...song,
              id: collidingSong.id,
              filePath: song.filePath,
              updatedAt: new Date().toISOString()
            };
            
            addedCount++;
            migratedCount++;
            details.push(`[Migrated] ${collidingSong.title} (Reason: ${duplicateReason})`);
            
            // Update temporary sets so subsequent files in this batch don't collide with the old path
            existingPaths.delete(collidingSong.filePath);
            existingPaths.add(song.filePath);
            
            continue;
          }

          // If the old file DOES exist, then it's a true duplicate.
          console.error('\x1b[41m%s\x1b[0m', `❌ [GUARD 3] COLLISION! Reason: ${duplicateReason}`);
          console.error('New:', { path: song.filePath, hash: song.hash, title: song.title, artist: song.artist });
          console.error('Existing:', { 
            id: collidingSong.id,
            path: collidingSong.filePath, 
            hash: collidingSong.hash,
            title: collidingSong.title, 
            artist: collidingSong.artist 
          });

          duplicatePaths.push(song.filePath);
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
          dateAdded: new Date().toISOString()
        };
        songs[newSongData.id] = newSongData;
        libraryUpdate.songIds.push(newSongData.id);
        newSongTitles.push(newSongData.title);
        addedCount++;
        logger.info('[Library] Final Action: ADDED', { path: song.filePath });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(`[Library] Failed to process song: ${song.filePath}`, err);
        const basename = song.filePath.split(/[/\\]/).pop() || 'Unknown';
        details.push(`[Error] ${song.title || basename}: ${errorMsg}`);
      }
    }

      // Save back using the adapter
      if (addedCount > 0) {
        await this.storageAdapter.saveSongs(songs);
        await this.storageAdapter.saveLibrary(libraryUpdate);
      }

      // Summarize additions
      const freshAdded = addedCount - migratedCount;
      if (freshAdded > 0) {
        if (freshAdded <= 5) {
          newSongTitles.forEach(t => details.push(`[Added] ${t}`));
        } else {
          details.push(`[Added] ${freshAdded} new songs`);
        }
      }

      return { addedCount, migratedCount, duplicatePaths, duplicateSongs, details };
    });
  }

  /**
   * Calculates similarity between two audio fingerprints using Fuzzy Matching and a Sliding Window approach.
   * Tolerates audio compression artifacts by awarding partial scores for characters with minor ASCII distances.
   */
  private calculateSimilarity(hashA: string, hashB: string): number {
    const lenA = hashA.length;
    const lenB = hashB.length;
    if (lenA === 0 || lenB === 0) return 0;

    let maxScore = 0;
    const offsetRange = 10;

    // Slide hashB over hashA with an offset from -10 to +10
    for (let offset = -offsetRange; offset <= offsetRange; offset++) {
      let score = 0;

      for (let i = 0; i < lenA; i++) {
        const j = i + offset;
        // Ensure index j is within bounds for hashB
        if (j >= 0 && j < lenB) {
          // FUZZY MATCH: Calculate ASCII distance
          const dist = Math.abs(hashA.charCodeAt(i) - hashB.charCodeAt(j));
          if (dist === 0) {
            score += 1.0; // Exact match
          } else if (dist === 1) {
            score += 0.8; // Minor compression artifact (e.g., 'm' vs 'l')
          } else if (dist === 2) {
            score += 0.4; // Moderate distortion
          }
        }
      }

      // We normalize by the length of the anchor (hashA)
      const normalizedScore = score / lenA;
      if (normalizedScore > maxScore) {
        maxScore = normalizedScore;
      }
    }

    return maxScore;
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

      // Sanitize: ensure PlaylistDetail properties (like full songs array) are stripped
      // before persisting to storage to prevent database bloat
      const cleanPlaylist: Playlist = {
        id: updatedPlaylist.id,
        name: updatedPlaylist.name,
        description: updatedPlaylist.description,
        songIds: updatedPlaylist.songIds,
        createdAt: updatedPlaylist.createdAt,
      };

      customPlaylists[updatedPlaylist.id] = cleanPlaylist;
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
   * Patches a song with new data.
   */
  public async patchSong(songId: string, updates: Partial<Song>): Promise<Song | null> {
    return await this.storageAdapter.patchSong(songId, updates);
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


