import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MobileAudioCacheService,
  DEFAULT_CACHE_SETTINGS,
  type AudioCacheEntry,
} from '../../../infrastructure/services/MobileAudioCacheService';
import { AUDIO_CACHE_LEDGER_KEY, AUDIO_CACHE_SETTINGS_KEY } from '../../../infrastructure/storage/keys';

const mockFileInstances: Record<string, any> = {};

vi.mock('expo-file-system', () => {
  return {
    Paths: {
      cache: 'mock-cache-path',
      document: 'mock-document-path',
    },
    Directory: vi.fn().mockImplementation(function (this: any, parent: any, name: string) {
      this.uri = typeof parent === 'object' ? `${parent.uri}/${name}` : `${parent}/${name}`;
      this.exists = true;
      this.create = vi.fn();
    }),
    File: vi.fn().mockImplementation(function (this: any, pathOrDir: any, name?: string) {
      this.uri = typeof pathOrDir === 'object' && name ? `${pathOrDir.uri}/${name}` : String(pathOrDir);
      this.exists = true;
      this.size = 1024;
      this.info = vi.fn().mockReturnValue({ exists: true });
      this.write = vi.fn();
      this.delete = vi.fn();
      mockFileInstances[this.uri] = this;
    }),
  };
});

describe('MobileAudioCacheService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('settings', () => {
    it('returns default settings if none saved', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const settings = await MobileAudioCacheService.getSettings();
      expect(settings).toEqual(DEFAULT_CACHE_SETTINGS);
    });

    it('saves updated settings', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const updated = await MobileAudioCacheService.setSettings({ maxSizeBytes: 250 * 1024 * 1024 });
      expect(updated.maxSizeBytes).toBe(250 * 1024 * 1024);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUDIO_CACHE_SETTINGS_KEY,
        expect.stringContaining('262144000')
      );
    });
  });

  describe('getCachedUri', () => {
    it('returns null if track is not in ledger', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify({}));
      const res = await MobileAudioCacheService.getCachedUri('song-1');
      expect(res).toBeNull();
    });

    it('returns localUri and touches timestamp when entry exists and file is on disk', async () => {
      const entry: AudioCacheEntry = {
        songId: 'song-1',
        streamUrl: 'http://server:4545/api/stream/1',
        localUri: 'mock-cache-path/melovista/audio_cache/song_1.mp3',
        fileSize: 1024,
        cachedAt: 1000,
        lastAccessedAt: 1000,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ 'song-1': entry }));

      const uri = await MobileAudioCacheService.getCachedUri('song-1');
      expect(uri).toBe('mock-cache-path/melovista/audio_cache/song_1.mp3');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUDIO_CACHE_LEDGER_KEY,
        expect.stringContaining('song-1')
      );
    });
  });

  describe('cacheSongStream', () => {
    it('downloads stream using Atomic Write (.tmp -> .mp3) and records entry in ledger', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({}));

      const mockBytes = new Uint8Array([10, 20, 30, 40]);
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockBytes.buffer,
      } as unknown as Response);

      const cachedUri = await MobileAudioCacheService.cacheSongStream('track-100', 'http://server:4545/api/stream/100');

      expect(cachedUri).toContain('track_100.mp3');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUDIO_CACHE_LEDGER_KEY,
        expect.stringContaining('track-100')
      );
    });

    it('returns null if remote fetch fails', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({}));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response);

      const res = await MobileAudioCacheService.cacheSongStream('track-err', 'http://server:4545/api/stream/err');
      expect(res).toBeNull();
    });
  });

  describe('pruneToLowWatermark (LRU Eviction)', () => {
    it('prunes oldest accessed entries down to Low Watermark when cache exceeds limit', async () => {
      // 100MB limit, 80MB low watermark
      const smallSettings = {
        maxSizeBytes: 100,
        lowWatermarkRatio: 0.8, // 80 bytes
      };
      vi.mocked(AsyncStorage.getItem).mockImplementation(async (key) => {
        if (key === AUDIO_CACHE_SETTINGS_KEY) return JSON.stringify(smallSettings);
        if (key === AUDIO_CACHE_LEDGER_KEY) {
          return JSON.stringify({
            'song-old': {
              songId: 'song-old',
              streamUrl: 'http://server/old',
              localUri: 'mock-cache-path/old.mp3',
              fileSize: 40,
              cachedAt: 100,
              lastAccessedAt: 100, // oldest
            },
            'song-mid': {
              songId: 'song-mid',
              streamUrl: 'http://server/mid',
              localUri: 'mock-cache-path/mid.mp3',
              fileSize: 40,
              cachedAt: 200,
              lastAccessedAt: 200,
            },
            'song-new': {
              songId: 'song-new',
              streamUrl: 'http://server/new',
              localUri: 'mock-cache-path/new.mp3',
              fileSize: 30,
              cachedAt: 300,
              lastAccessedAt: 300, // newest
            },
          });
        }
        return null;
      });

      // Total = 40 + 40 + 30 = 110 bytes > 100 bytes (High Watermark).
      // Target Low Watermark = 80 bytes.
      // Needs to evict song-old (40 bytes), leaving 70 bytes <= 80 bytes.
      await MobileAudioCacheService.pruneToLowWatermark(0);

      // Verify song-old was deleted
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        AUDIO_CACHE_LEDGER_KEY,
        expect.not.stringContaining('song-old')
      );
    });
  });

  describe('clearCache', () => {
    it('removes all cached files and resets ledger key in AsyncStorage', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify({
          'song-1': {
            songId: 'song-1',
            localUri: 'mock-cache-path/1.mp3',
            fileSize: 100,
          },
        })
      );

      await MobileAudioCacheService.clearCache();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUDIO_CACHE_LEDGER_KEY);
    });
  });

  describe('getCacheStats', () => {
    it('calculates total size and formatted strings', async () => {
      vi.mocked(AsyncStorage.getItem).mockImplementation(async (key) => {
        if (key === AUDIO_CACHE_SETTINGS_KEY) return JSON.stringify(DEFAULT_CACHE_SETTINGS);
        if (key === AUDIO_CACHE_LEDGER_KEY) {
          return JSON.stringify({
            s1: { songId: 's1', fileSize: 10 * 1024 * 1024 },
            s2: { songId: 's2', fileSize: 15 * 1024 * 1024 },
          });
        }
        return null;
      });

      const stats = await MobileAudioCacheService.getCacheStats();
      expect(stats.count).toBe(2);
      expect(stats.totalSizeBytes).toBe(25 * 1024 * 1024);
      expect(stats.formattedUsed).toBe('25.0 MB');
    });
  });
});
