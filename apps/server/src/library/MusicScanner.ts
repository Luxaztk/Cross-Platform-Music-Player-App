import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as mm from 'music-metadata';
import type { Song } from '@music/types';

export interface IndexedSong {
  song: Song;
  physicalPath: string;
}

export interface CoverData {
  buffer: Buffer;
  mime: string;
}

const SUPPORTED_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus']);

export class MusicScanner {
  private songsMap = new Map<string, IndexedSong>();
  private coverMap = new Map<string, CoverData>();
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public generateId(filePath: string): string {
    return 'srv-' + crypto.createHash('md5').update(path.normalize(filePath).toLowerCase()).digest('hex').substring(0, 16);
  }

  private watcher: fs.FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  public async indexSingleFile(filePath: string): Promise<Song | null> {
    if (!fs.existsSync(filePath)) return null;

    try {
      const id = this.generateId(filePath);
      const stat = fs.statSync(filePath);
      let metadata: mm.IAudioMetadata | null = null;
      try {
        metadata = await mm.parseFile(filePath, { skipCovers: false });
      } catch {
        // Fallback if audio metadata cannot be parsed
      }

      const title = metadata?.common.title || path.basename(filePath, path.extname(filePath));
      const artist = metadata?.common.artist || metadata?.common.albumartist || 'Unknown Artist';
      const artists = metadata?.common.artists && metadata?.common.artists.length > 0
        ? metadata.common.artists
        : [artist];
      const album = metadata?.common.album || 'Unknown Album';
      const duration = Math.round(metadata?.format.duration || 0);
      const genre = (metadata?.common.genre && metadata?.common.genre[0]) || 'Music';
      const year = metadata?.common.year || null;

      // Album Artwork
      let coverArtUrl: string | null = null;
      if (metadata?.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        this.coverMap.set(id, {
          buffer: Buffer.from(pic.data),
          mime: pic.format || 'image/jpeg',
        });
        coverArtUrl = `${this.baseUrl}/api/cover/${id}`;
      }

      const hash = this.calculateFastHash(filePath);

      const song: Song = {
        id,
        title,
        artist,
        artists,
        album,
        duration,
        genre,
        year,
        coverArt: coverArtUrl,
        filePath: `${this.baseUrl}/api/stream/${id}`,
        sourceType: 'stream',
        streamUrl: `${this.baseUrl}/api/stream/${id}`,
        fileSize: stat.size,
        hash,
        dateAdded: stat.birthtime.toISOString(),
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
      };

      this.songsMap.set(id, { song, physicalPath: filePath });
      return song;
    } catch (err) {
      console.error(`[MusicScanner] Failed to parse metadata for: ${filePath}`, err);
      return null;
    }
  }

  public pruneOrphans(): number {
    let prunedCount = 0;
    for (const [id, item] of this.songsMap.entries()) {
      if (!fs.existsSync(item.physicalPath)) {
        this.songsMap.delete(id);
        this.coverMap.delete(id);
        console.log(`[MusicScanner] Pruned orphan song: "${item.song.title}" (file deleted on disk: ${item.physicalPath})`);
        prunedCount++;
      }
    }
    return prunedCount;
  }

  public async scanDirectory(directoryPath: string): Promise<number> {
    if (!fs.existsSync(directoryPath)) {
      try {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log(`[MusicScanner] Created music directory: ${directoryPath}`);
      } catch (_err) {
        console.warn(`[MusicScanner] Directory does not exist and could not be created: ${directoryPath}`);
      }
      this.pruneOrphans();
      return 0;
    }

    const audioFiles: string[] = [];
    this.collectAudioFiles(directoryPath, audioFiles);

    let count = 0;
    for (const filePath of audioFiles) {
      const id = this.generateId(filePath);
      if (!this.songsMap.has(id)) {
        const song = await this.indexSingleFile(filePath);
        if (song) count++;
      } else {
        count++;
      }
    }

    // Automatically prune any indexed songs whose physical files were deleted
    const pruned = this.pruneOrphans();
    if (pruned > 0) {
      console.log(`[MusicScanner] Cleaned up ${pruned} orphan songs missing from disk.`);
    }

    console.log(`[MusicScanner] Scanned ${count} songs from ${directoryPath} (Total active: ${this.songsMap.size})`);
    return this.songsMap.size;
  }

  public calculateFastHash(filePath: string): string {
    try {
      const fd = fs.openSync(filePath, 'r');
      const stat = fs.fstatSync(fd);
      const chunkSize = Math.min(65536, stat.size);
      const buf1 = Buffer.alloc(chunkSize);
      fs.readSync(fd, buf1, 0, chunkSize, 0);
      const buf2 = Buffer.alloc(chunkSize);
      const offset2 = Math.max(0, stat.size - chunkSize);
      fs.readSync(fd, buf2, 0, chunkSize, offset2);
      fs.closeSync(fd);
      return 'f1:' + crypto.createHash('sha256').update(buf1).update(buf2).digest('hex').substring(0, 32);
    } catch {
      return '';
    }
  }

  public calculatePerceptualSimilarity(hashA: string, hashB: string): number {
    const lenA = hashA.length;
    const lenB = hashB.length;
    if (lenA === 0 || lenB === 0) return 0;
    let maxScore = 0;
    const offsetRange = 10;
    for (let offset = -offsetRange; offset <= offsetRange; offset++) {
      let score = 0;
      for (let i = 0; i < lenA; i++) {
        const j = i + offset;
        if (j >= 0 && j < lenB) {
          const dist = Math.abs(hashA.charCodeAt(i) - hashB.charCodeAt(j));
          if (dist === 0) score += 1.0;
          else if (dist === 1) score += 0.8;
          else if (dist === 2) score += 0.4;
        }
      }
      const norm = score / lenA;
      if (norm > maxScore) maxScore = norm;
    }
    return maxScore;
  }

  public findMatch(target: {
    title: string;
    artist: string;
    duration?: number;
    hash?: string;
    fileSize?: number;
  }): { matched: boolean; song?: Song; matchReason?: 'HASH' | 'METADATA' } {
    // 1. Tier 1: Audio Fingerprint / Content Hash Match
    if (target.hash) {
      for (const item of this.songsMap.values()) {
        if (item.song.hash && item.song.hash === target.hash) {
          return { matched: true, song: item.song, matchReason: 'HASH' };
        }
        if (item.song.hash?.startsWith('p2:') && target.hash.startsWith('p2:')) {
          const sim = this.calculatePerceptualSimilarity(target.hash.slice(3), item.song.hash.slice(3));
          if (sim >= 0.85) {
            return { matched: true, song: item.song, matchReason: 'HASH' };
          }
        }
      }
    }

    // 2. Tier 2: Normalized Title + Artist + Duration (±3s) Match
    const normTargetTitle = target.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const normTargetArtist = target.artist.toLowerCase().trim().replace(/[^\w\s]/g, '');

    for (const item of this.songsMap.values()) {
      const itemTitle = item.song.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
      const itemArtist = item.song.artist.toLowerCase().trim().replace(/[^\w\s]/g, '');

      if (normTargetTitle && normTargetTitle === itemTitle) {
        const artistMatch =
          !normTargetArtist ||
          normTargetArtist === itemArtist ||
          itemArtist.includes(normTargetArtist) ||
          normTargetArtist.includes(itemArtist);

        if (artistMatch) {
          if (target.duration && item.song.duration) {
            const diff = Math.abs(target.duration - item.song.duration);
            if (diff <= 3) {
              return { matched: true, song: item.song, matchReason: 'METADATA' };
            }
          } else {
            return { matched: true, song: item.song, matchReason: 'METADATA' };
          }
        }
      }
    }

    return { matched: false };
  }

  public async addUploadedSong(
    physicalPath: string,
    clientMetadata?: Partial<Song>
  ): Promise<Song> {
    const id = this.generateId(physicalPath);
    const stat = fs.statSync(physicalPath);
    let metadata: mm.IAudioMetadata | null = null;
    try {
      metadata = await mm.parseFile(physicalPath, { skipCovers: false });
    } catch {
      // Fallback
    }

    const title = clientMetadata?.title || metadata?.common.title || path.basename(physicalPath, path.extname(physicalPath));
    const artist = clientMetadata?.artist || metadata?.common.artist || metadata?.common.albumartist || 'Unknown Artist';
    const artists = metadata?.common.artists && metadata?.common.artists.length > 0 ? metadata.common.artists : [artist];
    const album = clientMetadata?.album || metadata?.common.album || 'Unknown Album';
    const duration = clientMetadata?.duration || Math.round(metadata?.format.duration || 0);
    const genre = (metadata?.common.genre && metadata?.common.genre[0]) || 'Music';
    const year = metadata?.common.year || null;
    const hash = clientMetadata?.hash || this.calculateFastHash(physicalPath);

    let coverArtUrl: string | null = null;
    if (metadata?.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      this.coverMap.set(id, {
        buffer: Buffer.from(pic.data),
        mime: pic.format || 'image/jpeg',
      });
      coverArtUrl = `${this.baseUrl}/api/cover/${id}`;
    }

    const song: Song = {
      id,
      title,
      artist,
      artists,
      album,
      duration,
      genre,
      year,
      coverArt: coverArtUrl,
      filePath: `${this.baseUrl}/api/stream/${id}`,
      sourceType: 'stream',
      streamUrl: `${this.baseUrl}/api/stream/${id}`,
      fileSize: stat.size,
      hash,
      dateAdded: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.songsMap.set(id, { song, physicalPath });
    console.log(`[MusicScanner] Indexed uploaded song: "${title}" by "${artist}" (id: ${id}, hash: ${hash})`);
    return song;
  }

  private collectAudioFiles(dir: string, fileList: string[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectAudioFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          fileList.push(fullPath);
        }
      }
    }
  }

  public getSongs(): Song[] {
    this.pruneOrphans();
    return Array.from(this.songsMap.values()).map((item) => ({
      ...item.song,
      filePath: `${this.baseUrl}/api/stream/${item.song.id}`,
      streamUrl: `${this.baseUrl}/api/stream/${item.song.id}`,
      coverArt: this.coverMap.has(item.song.id) ? `${this.baseUrl}/api/cover/${item.song.id}` : null,
    }));
  }

  public getIndexedSong(id: string): IndexedSong | undefined {
    const indexed = this.songsMap.get(id);
    if (indexed && !fs.existsSync(indexed.physicalPath)) {
      this.songsMap.delete(id);
      this.coverMap.delete(id);
      console.log(`[MusicScanner] Pruned orphan song during access: "${indexed.song.title}" (id: ${id})`);
      return undefined;
    }
    return indexed;
  }

  public setIndexedSong(id: string, indexed: IndexedSong): void {
    this.songsMap.set(id, indexed);
  }

  public getCover(id: string): CoverData | undefined {
    return this.coverMap.get(id);
  }

  public setCover(id: string, cover: CoverData): void {
    this.coverMap.set(id, cover);
  }

  public removeSong(id: string): { success: boolean; physicalPath?: string } {
    const indexed = this.songsMap.get(id);
    if (!indexed) return { success: false };

    this.songsMap.delete(id);
    this.coverMap.delete(id);
    console.log(`[MusicScanner] Removed song from index: "${indexed.song.title}" (id: ${id})`);
    return { success: true, physicalPath: indexed.physicalPath };
  }

  public startWatching(directoryPath: string): void {
    this.stopWatching();
    if (!fs.existsSync(directoryPath)) return;

    try {
      this.watcher = fs.watch(directoryPath, { recursive: true }, (_eventType, filename) => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(async () => {
          const pruned = this.pruneOrphans();
          if (filename) {
            const fullPath = path.join(directoryPath, filename);
            const ext = path.extname(filename).toLowerCase();
            if (SUPPORTED_EXTENSIONS.has(ext) && fs.existsSync(fullPath)) {
              const id = this.generateId(fullPath);
              if (!this.songsMap.has(id)) {
                await this.indexSingleFile(fullPath);
              }
            }
          }
          if (pruned > 0) {
            console.log(`[MusicScanner] Auto-cleaned ${pruned} orphan songs following filesystem event.`);
          }
        }, 500);
      });
      console.log(`[MusicScanner] Real-time filesystem watcher active on: ${directoryPath}`);
    } catch (err) {
      console.warn(`[MusicScanner] Could not start filesystem watcher:`, err);
    }
  }

  public stopWatching(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      try {
        this.watcher.close();
      } catch {
        // Ignored
      }
      this.watcher = null;
    }
  }

  public clear(): void {
    this.stopWatching();
    this.songsMap.clear();
    this.coverMap.clear();
  }
}
