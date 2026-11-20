import path from 'node:path';
import { copyFileSync, existsSync } from 'node:fs';
import { app } from 'electron';
import Store from 'electron-store';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';
import { canonicalizeArtistCredits, type IStorageAdapter } from '@music/core';
import { DEFAULT_SETTINGS, type AppSettings } from '../../src/presentations/constants/SettingsConstants';

interface StoreSchema {
  library: Playlist;
  songs: Record<string, Song>;
  playlists: Record<string, Playlist>;
  playerState: PlayerState | null;
  recentSearches: RecentSearch[];
  lyricUsage: Record<string, number>;
  settings: AppSettings;
  artistCanonicalizationVersion: number;
}

const ARTIST_CANONICALIZATION_VERSION = 2;

export class MainStorageAdapter implements IStorageAdapter {
  private store: Store<StoreSchema>;

  constructor() {
    // Determine default download path dynamically
    let defaultDownloadPath = '';
    try {
      defaultDownloadPath = path.join(app.getPath('music'), 'Melovista Downloads');
    } catch {
      console.warn('[Storage] Failed to get music path, using empty default');
    }

    const mergedDefaults = {
      ...DEFAULT_SETTINGS,
      downloads: {
        ...DEFAULT_SETTINGS.downloads,
        downloadPath: defaultDownloadPath
      }
    };

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
        settings: mergedDefaults as AppSettings,
        artistCanonicalizationVersion: 0,
      }
    });

    // Self-healing migration: Strip any bloated `songs` array accidentally stored in playlists
    this.sanitizeStoredPlaylists();
    this.canonicalizeStoredSongArtists();
  }

  private canonicalizeStoredSongArtists(): void {
    try {
      const currentVersion = this.store.get('artistCanonicalizationVersion') || 0;
      if (currentVersion >= ARTIST_CANONICALIZATION_VERSION) return;

      const storedSongs = this.store.get('songs') || {};
      let changedSongCount = 0;
      const canonicalSongs: Record<string, Song> = {};

      for (const [id, song] of Object.entries(storedSongs)) {
        const canonicalArtists = canonicalizeArtistCredits(song.artist, song.artists);
        const currentArtists = song.artists ?? [];
        const artistsChanged = canonicalArtists.length !== currentArtists.length
          || canonicalArtists.some((artist, index) => artist !== currentArtists[index]);

        if (artistsChanged) changedSongCount += 1;
        canonicalSongs[id] = artistsChanged ? { ...song, artists: canonicalArtists } : song;
      }

      if (changedSongCount > 0) {
        const storePath = this.store.path;
        if (existsSync(storePath)) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          copyFileSync(storePath, `${storePath}.artist-backup-${timestamp}`);
        }
        this.store.set('songs', canonicalSongs);
        console.log(`[Storage] Canonicalized artists for ${changedSongCount} stored songs without changing raw artist credits.`);
      }

      this.store.set('artistCanonicalizationVersion', ARTIST_CANONICALIZATION_VERSION);
    } catch (err) {
      console.error('[Storage] Artist canonicalization migration failed:', err);
    }
  }

  private sanitizeStoredPlaylists(): void {
    try {
      const storedPlaylists = this.store.get('playlists') || {};
      let needsPrune = false;
      const cleaned: Record<string, Playlist> = {};

      for (const [id, playlist] of Object.entries(storedPlaylists)) {
        if (
          (playlist as unknown as { songs?: unknown }).songs ||
          (playlist as unknown as { songCount?: unknown }).songCount
        ) {
          needsPrune = true;
          cleaned[id] = {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            songIds: playlist.songIds || [],
            createdAt: playlist.createdAt || new Date().toISOString(),
          };
        } else {
          cleaned[id] = playlist;
        }
      }

      if (needsPrune) {
        console.log('[Storage] Self-healing migration: Pruned bloated songs array from stored playlists.');
        this.store.set('playlists', cleaned);
      }
    } catch (err) {
      console.error('[Storage] Error during playlist sanitization:', err);
    }
  }

  async getLibrary(): Promise<Playlist> {
    return this.store.get('library');
  }

  async getSongs(): Promise<Record<string, Song>> {
    return this.store.get('songs');
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    this.store.set('songs', songs);
  }

  async saveLibrary(library: Playlist): Promise<void> {
    this.store.set('library', library);
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    const cleaned: Record<string, Playlist> = {};
    for (const [id, playlist] of Object.entries(playlists)) {
      if (
        (playlist as unknown as { songs?: unknown }).songs ||
        (playlist as unknown as { songCount?: unknown }).songCount
      ) {
        cleaned[id] = {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          songIds: playlist.songIds || [],
          createdAt: playlist.createdAt || new Date().toISOString(),
        };
      } else {
        cleaned[id] = playlist;
      }
    }
    this.store.set('playlists', cleaned);
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

  async incrementLyricUsage(id: number): Promise<void> {
    const usage = await this.getLyricUsage();
    usage[id.toString()] = (usage[id.toString()] || 0) + 1;
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
  async getSettings(): Promise<AppSettings> {
    const saved = (this.store.get('settings') || {}) as Partial<AppSettings>;
    const settings: AppSettings = {
      general: { ...DEFAULT_SETTINGS.general, ...(saved.general || {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(saved.appearance || {}) },
      audio: { ...DEFAULT_SETTINGS.audio, ...(saved.audio || {}) },
      downloads: { ...DEFAULT_SETTINGS.downloads, ...(saved.downloads || {}) },
      server: { ...DEFAULT_SETTINGS.server, ...(saved.server || {}) },
      playback: { ...DEFAULT_SETTINGS.playback, ...(saved.playback || {}) },
    };

    // Ensure downloadPath is never empty when sent to UI
    if (!settings.downloads.downloadPath) {
      try {
        settings.downloads.downloadPath = path.join(app.getPath('music'), 'Melovista Downloads');
      } catch {
        console.warn('[Storage] Failed to resolve default download path in getSettings');
      }
    }

    return settings;
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      general: { ...current.general, ...(settings.general || {}) },
      appearance: { ...current.appearance, ...(settings.appearance || {}) },
      audio: { ...current.audio, ...(settings.audio || {}) },
      downloads: { ...current.downloads, ...(settings.downloads || {}) },
      server: { ...current.server, ...(settings.server || {}) },
      playback: { ...current.playback, ...(settings.playback || {}) },
    };
    this.store.set('settings', updated);
  }

  async clear(): Promise<void> {
    this.store.clear();
    console.warn('\x1b[41m%s\x1b[0m', '🚨 [Storage] ADAPTER MEMORY WIPED');
  }
}
