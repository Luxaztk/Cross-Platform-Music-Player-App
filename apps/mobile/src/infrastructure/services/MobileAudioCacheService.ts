import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import { AUDIO_CACHE_LEDGER_KEY, AUDIO_CACHE_SETTINGS_KEY } from '../storage/keys';

export interface AudioCacheEntry {
  songId: string;
  streamUrl: string;
  localUri: string;
  fileSize: number;
  cachedAt: number;
  lastAccessedAt: number;
}

export interface AudioCacheSettings {
  maxSizeBytes: number; // Default: 500 MB (524,288,000 bytes)
  lowWatermarkRatio: number; // Default: 0.8 (400 MB)
}

export const DEFAULT_CACHE_SETTINGS: AudioCacheSettings = {
  maxSizeBytes: 500 * 1024 * 1024, // 500 MB
  lowWatermarkRatio: 0.8, // 80% (400 MB)
};

function safeFileName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

export class MobileAudioCacheService {
  private static getCacheDir(): Directory {
    const dir = new Directory(Paths.cache, 'melovista/audio_cache');
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
    return dir;
  }

  /**
   * Retrieves current cache settings.
   */
  static async getSettings(): Promise<AudioCacheSettings> {
    try {
      const raw = await AsyncStorage.getItem(AUDIO_CACHE_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          maxSizeBytes: parsed.maxSizeBytes || DEFAULT_CACHE_SETTINGS.maxSizeBytes,
          lowWatermarkRatio: parsed.lowWatermarkRatio || DEFAULT_CACHE_SETTINGS.lowWatermarkRatio,
        };
      }
    } catch {
      // fallback to defaults
    }
    return { ...DEFAULT_CACHE_SETTINGS };
  }

  /**
   * Updates cache settings (e.g. max quota).
   */
  static async setSettings(partial: Partial<AudioCacheSettings>): Promise<AudioCacheSettings> {
    const current = await this.getSettings();
    const updated: AudioCacheSettings = {
      ...current,
      ...partial,
    };
    await AsyncStorage.setItem(AUDIO_CACHE_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  /**
   * Retrieves the LRU ledger (index of all cached tracks).
   */
  static async getLedger(): Promise<Record<string, AudioCacheEntry>> {
    try {
      const raw = await AsyncStorage.getItem(AUDIO_CACHE_LEDGER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Saves the LRU ledger to persistent storage.
   */
  private static async saveLedger(ledger: Record<string, AudioCacheEntry>): Promise<void> {
    await AsyncStorage.setItem(AUDIO_CACHE_LEDGER_KEY, JSON.stringify(ledger));
  }

  /**
   * Updates the lastAccessedAt timestamp for a cached song (Touch-on-read).
   */
  static async touch(songId: string): Promise<void> {
    const ledger = await this.getLedger();
    if (ledger[songId]) {
      ledger[songId].lastAccessedAt = Date.now();
      await this.saveLedger(ledger);
    }
  }

  /**
   * Checks if a song is cached locally and returns its local file URI.
   * If the physical file is missing, cleans up the ledger entry.
   */
  static async getCachedUri(songId?: string, streamUrl?: string): Promise<string | null> {
    const ledger = await this.getLedger();
    let entry: AudioCacheEntry | undefined;

    if (songId && ledger[songId]) {
      entry = ledger[songId];
    } else if (streamUrl) {
      entry = Object.values(ledger).find((e) => e.streamUrl === streamUrl);
    }

    if (!entry) return null;

    // Verify physical file exists on disk
    const file = new File(entry.localUri);
    const exists = file.exists || file.info().exists;

    if (!exists) {
      delete ledger[entry.songId];
      await this.saveLedger(ledger);
      return null;
    }

    // Touch access time
    entry.lastAccessedAt = Date.now();
    await this.saveLedger(ledger);

    return entry.localUri;
  }

  /**
   * Checks if a streamUrl is cached locally and returns its local file URI.
   */
  static async getCachedUriByUrl(streamUrl: string): Promise<string | null> {
    return this.getCachedUri(undefined, streamUrl);
  }

  /**
   * Downloads a stream into cache using Atomic Write (.tmp -> .mp3)
   * and prunes oldest entries if total cache exceeds High Watermark.
   */
  static async cacheSongStream(songId: string, streamUrl: string): Promise<string | null> {
    if (!songId || !streamUrl) return null;

    // Check if already in cache
    const existing = await this.getCachedUri(songId, streamUrl);
    if (existing) return existing;

    const baseDir = this.getCacheDir();
    const safeId = safeFileName(songId);
    const tmpFileName = `${safeId}.tmp`;
    const finalFileName = `${safeId}.mp3`;

    const tmpFile = new File(baseDir, tmpFileName);
    const finalFile = new File(baseDir, finalFileName);

    try {
      // 1. Fetch remote audio stream
      const response = await fetch(streamUrl);
      if (!response.ok) {
        return null;
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const incomingSize = bytes.byteLength;

      if (incomingSize === 0) {
        return null;
      }

      // 2. High/Low Watermark Pruning before saving
      await this.pruneToLowWatermark(incomingSize);

      // 3. Atomic Write: Write to .tmp file first
      tmpFile.write(bytes);

      if (!tmpFile.exists && !tmpFile.info().exists) {
        return null;
      }

      // 4. Commit: Move/write to final .mp3 file
      finalFile.write(bytes);
      try {
        tmpFile.delete();
      } catch {
        // ignore tmp deletion error
      }

      // 5. Update LRU Ledger
      const ledger = await this.getLedger();
      const now = Date.now();
      ledger[songId] = {
        songId,
        streamUrl,
        localUri: finalFile.uri,
        fileSize: incomingSize,
        cachedAt: now,
        lastAccessedAt: now,
      };
      await this.saveLedger(ledger);

      return finalFile.uri;
    } catch (err) {
      console.warn(`[cache] Failed to cache track ${songId}:`, err);
      try {
        if (tmpFile.exists || tmpFile.info().exists) {
          tmpFile.delete();
        }
      } catch {
        // ignore cleanup error
      }
      return null;
    }
  }

  /**
   * Watermark Pruning:
   * When total size + incomingBytes > High Watermark (maxSizeBytes),
   * evicts oldest accessed files until total size <= Low Watermark (maxSizeBytes * lowWatermarkRatio).
   */
  static async pruneToLowWatermark(incomingBytes: number = 0): Promise<void> {
    const settings = await this.getSettings();
    const ledger = await this.getLedger();
    const entries = Object.values(ledger);

    let currentTotal = entries.reduce((acc, e) => acc + (e.fileSize || 0), 0);

    // If headroom is sufficient, no pruning required
    if (currentTotal + incomingBytes <= settings.maxSizeBytes) {
      return;
    }

    const targetSize = settings.maxSizeBytes * settings.lowWatermarkRatio;

    // Sort by lastAccessedAt ascending (oldest accessed first)
    entries.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

    for (const entry of entries) {
      if (currentTotal + incomingBytes <= targetSize) {
        break;
      }

      try {
        const file = new File(entry.localUri);
        if (file.exists || file.info().exists) {
          file.delete();
        }
      } catch {
        // Ignore file delete errors
      }

      currentTotal -= entry.fileSize || 0;
      delete ledger[entry.songId];
    }

    await this.saveLedger(ledger);
  }

  /**
   * Wipes all audio cache files and resets ledger.
   */
  static async clearCache(): Promise<void> {
    try {
      const ledger = await this.getLedger();
      for (const entry of Object.values(ledger)) {
        try {
          const file = new File(entry.localUri);
          if (file.exists || file.info().exists) {
            file.delete();
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    await AsyncStorage.removeItem(AUDIO_CACHE_LEDGER_KEY);
  }

  /**
   * Returns stats about current cache usage.
   */
  static async getCacheStats(): Promise<{
    count: number;
    totalSizeBytes: number;
    maxSizeBytes: number;
    formattedUsed: string;
    formattedMax: string;
  }> {
    const settings = await this.getSettings();
    const ledger = await this.getLedger();
    const entries = Object.values(ledger);
    const totalSizeBytes = entries.reduce((acc, e) => acc + (e.fileSize || 0), 0);

    const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return {
      count: entries.length,
      totalSizeBytes,
      maxSizeBytes: settings.maxSizeBytes,
      formattedUsed: formatMb(totalSizeBytes),
      formattedMax: formatMb(settings.maxSizeBytes),
    };
  }
}
