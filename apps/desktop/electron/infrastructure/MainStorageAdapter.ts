import Store from 'electron-store';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';
import type { IStorageAdapter } from '@music/core';
import { DEFAULT_SETTINGS, getSafeDefaultDownloadPath, type AppSettings } from '../constants/SettingsConstants';

interface StoreSchema {
  library: Playlist;
  songs: Record<string, Song>;
  playlists: Record<string, Playlist>;
  playerState: PlayerState | null;
  recentSearches: RecentSearch[];
  lyricUsage: Record<string, number>;
  settings: AppSettings;
}

export class MainStorageAdapter implements IStorageAdapter {
  private store: Store<StoreSchema>;
  private readonly COVERS_DIR: string;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'melovista-library',
      defaults: {
        library: {
          id: '0',
          name: 'Library',
          description: 'All your songs',
          songIds: [],
          createdAt: new Date().toISOString()
        },
        songs: {},
        playlists: {},
        playerState: null,
        recentSearches: [],
        lyricUsage: {},
        settings: {
          ...DEFAULT_SETTINGS,
          downloads: {
            ...DEFAULT_SETTINGS.downloads,
            downloadPath: getSafeDefaultDownloadPath()
          }
        }
      }
    });

    this.COVERS_DIR = path.join(app.getPath('userData'), 'cache', 'covers');
  }

  /**
   * Initializes storage and runs mandatory migration
   */
  public async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.COVERS_DIR, { recursive: true });
      await this.runMigration();
      
      // Start background cleanup (non-blocking)
      this.cleanupOrphanedCovers().catch(err => {
        console.error('[MainStorageAdapter] Background cleanup failed:', err);
      });
    } catch (err) {
      console.error('[MainStorageAdapter] Initialization failed:', err);
    }
  }

  private async cleanupOrphanedCovers(): Promise<void> {
    const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    try {
      const songs = this.store.get('songs') || {};
      
      // Collect all referenced hashes (filenames)
      const referencedFiles = new Set<string>();
      
      const allSongs = Object.values(songs);
      for (const song of allSongs) {
        if (song.coverArt && song.coverArt.startsWith('melovista://app/')) {
          const fileName = decodeURIComponent(song.coverArt.replace('melovista://app/', ''));
          referencedFiles.add(fileName);
        }
      }

      // (Optional) Check playlists for unique covers if that feature is added in the future

      const files = await fs.readdir(this.COVERS_DIR);
      
      // Process in batches to avoid blocking the event loop too much
      const BATCH_SIZE = 10;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file) => {
          const filePath = path.join(this.COVERS_DIR, file);
          try {
            const stats = await fs.stat(filePath);
            const age = now - stats.mtimeMs;

            const isTemp = file.startsWith('temp_');
            const isOrphaned = !referencedFiles.has(file);

            if ((isTemp || isOrphaned) && age > GRACE_PERIOD_MS) {
              await fs.unlink(filePath);
              console.log(`[GC] Deleted ${isTemp ? 'temp' : 'orphaned'} file: ${file}`);
            }
          } catch (e) {
            // File might have been deleted already or is inaccessible
          }
        }));
        // Gentle yield to event loop
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (err) {
      console.error('[MainStorageAdapter] GC logic encountered an error:', err);
    }
  }

  private async runMigration(): Promise<void> {
    const songs = this.store.get('songs');
    if (!songs) return;

    let migratedCount = 0;
    const songEntries = Object.entries(songs);
    const total = songEntries.length;

    console.log(`[Migration] Starting Cover Art migration for ${total} songs...`);

    for (const [id, song] of songEntries) {
      try {
        if (song.coverArt && (song.coverArt.startsWith('data:image') || song.coverArt.includes(id))) {
          // If it's old ID-based path or data URI, migrate it
          const filePath = await this.saveCoverArtToFile(id, song.coverArt);
          if (filePath) {
            const fileName = path.basename(filePath);
            song.coverArt = `melovista://app/${encodeURIComponent(fileName)}`;
            migratedCount++;
          }
        }
      } catch (err) {
        console.error(`[Migration] Failed to migrate cover for song ${id} (${song.title}):`, err);
        continue;
      }
    }

    if (migratedCount > 0) {
      this.store.set('songs', songs);
      console.log(`[Migration] Successfully migrated ${migratedCount} covers to physical files.`);
    } else {
      console.log('[Migration] No covers needed migration.');
    }
  }

  private async saveCoverArtToFile(identifier: string, data: string): Promise<string | null> {
    try {
      let buffer: Buffer;
      let ext: string;

      if (data.startsWith('data:image')) {
        const match = data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!match) return null;
        ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else if (data.startsWith('melovista://app/')) {
        // Already a file-based URI, but might be old format. Read it to re-hash if needed.
        const oldFilePath = data.replace('melovista://app/', '');
        // We only migrate if it's the old naming scheme (contains ID)
        if (!oldFilePath.includes(identifier)) return null;
        
        try {
          const absolutePath = decodeURIComponent(oldFilePath);
          buffer = await fs.readFile(absolutePath);
          ext = path.extname(absolutePath).slice(1);
        } catch (e) {
          return null;
        }
      } else {
        return null;
      }

      const hash = createHash('sha256').update(buffer).digest('hex');
      const fileName = `${hash}.${ext}`;
      const finalPath = path.join(this.COVERS_DIR, fileName);

      // Deduplication: If file exists, return it
      try {
        await fs.access(finalPath, constants.F_OK);
        return finalPath;
      } catch {
        // File doesn't exist, proceed to write
      }

      // Atomic write: Write to temp file then rename
      const tempPath = path.join(this.COVERS_DIR, `temp_${fileName}`);
      await fs.writeFile(tempPath, buffer);
      await fs.rename(tempPath, finalPath);

      return finalPath;
    } catch (err) {
      console.error(`[MainStorageAdapter] Error saving cover art for ${identifier}:`, err);
      throw err;
    }
  }

  async getLibrary(): Promise<Playlist> {
    return this.store.get('library');
  }

  async getSongs(): Promise<Record<string, Song>> {
    return this.store.get('songs');
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    // Before saving, ensure any NEW base64 covers are converted to files
    for (const id in songs) {
      const song = songs[id];
      if (song.coverArt && (song.coverArt.startsWith('data:image') || (song.coverArt.startsWith('melovista://app/') && song.coverArt.includes(id)))) {
        try {
          const filePath = await this.saveCoverArtToFile(id, song.coverArt);
          if (filePath) {
            const fileName = path.basename(filePath);
            song.coverArt = `melovista://app/${encodeURIComponent(fileName)}`;
          }
        } catch (err) {
          console.error(`[MainStorageAdapter] Failed to convert/migrate cover for ${id}:`, err);
        }
      }
    }
    this.store.set('songs', songs);
  }

  async saveLibrary(library: Playlist): Promise<void> {
    this.store.set('library', library);
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    this.store.set('playlists', playlists);
  }

  async getPlaylists(): Promise<Record<string, Playlist>> {
    const playlists = this.store.get('playlists') || {};
    const library = await this.getLibrary();
    return { '0': library, ...playlists };
  }

  async getPlayerState(): Promise<PlayerState | null> {
    return this.store.get('playerState');
  }

  async savePlayerState(state: PlayerState): Promise<void> {
    this.store.set('playerState', state);
  }

  async getSongList(): Promise<Song[]> {
    const songs = await this.getSongs();
    return Object.values(songs);
  }

  async getSongById(id: string): Promise<Song | null> {
    const songs = await this.getSongs();
    return songs[id] || null;
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    return this.store.get('recentSearches') || [];
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    this.store.set('recentSearches', searches);
  }
  
  async getLyricUsage(): Promise<Record<string, number>> {
    return this.store.get('lyricUsage') || {};
  }

  async saveLyricUsage(usage: Record<string, number>): Promise<void> {
    this.store.set('lyricUsage', usage);
  }

  async incrementLyricUsage(lyricId: number | string): Promise<void> {
    const usage = await this.getLyricUsage();
    const idStr = lyricId.toString();
    usage[idStr] = (usage[idStr] || 0) + 1;
    await this.saveLyricUsage(usage);
  }

  async patchSong(songId: string, updates: Partial<Song>): Promise<Song | null> {
    const songs = await this.getSongs();
    if (!songs[songId]) return null;
    
    const updatedSong = { ...songs[songId], ...updates };
    songs[songId] = updatedSong;
    await this.saveSongs(songs);
    return updatedSong;
  }
}
