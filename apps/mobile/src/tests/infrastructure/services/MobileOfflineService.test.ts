import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MobileOfflineService } from '../../../infrastructure/services/MobileOfflineService';
import type { Song } from '@music/types';

const mockFileMap: Record<string, any> = {};

vi.mock('expo-file-system', () => {
  return {
    Paths: {
      document: 'mock-doc-path',
      cache: 'mock-cache-path',
    },
    Directory: vi.fn().mockImplementation(function (this: any, parent: any, name: string) {
      this.uri = typeof parent === 'object' ? `${parent.uri}/${name}` : `${parent}/${name}`;
      this.exists = true;
      this.create = vi.fn();
    }),
    File: vi.fn().mockImplementation(function (this: any, pathOrDir: any, name?: string) {
      this.uri = typeof pathOrDir === 'object' && name ? `${pathOrDir.uri}/${name}` : String(pathOrDir);
      this.exists = true;
      this.size = 2048;
      this.info = vi.fn().mockReturnValue({ exists: true });
      this.write = vi.fn();
      this.delete = vi.fn();
      mockFileMap[this.uri] = this;
    }),
  };
});

describe('MobileOfflineService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('isSongOffline', () => {
    it('returns false when isOffline is false or missing', () => {
      const song = { id: 's1', isOffline: false } as Song;
      expect(MobileOfflineService.isSongOffline(song)).toBe(false);
    });

    it('returns true when isOffline is true and file exists', () => {
      const song = {
        id: 's1',
        isOffline: true,
        localOfflinePath: 'mock-doc-path/melovista/offline/s1.mp3',
      } as Song;
      expect(MobileOfflineService.isSongOffline(song)).toBe(true);
    });
  });

  describe('downloadSongForOffline', () => {
    it('returns error if song has no stream URL', async () => {
      const song = { id: 's1', filePath: 'local/path' } as Song;
      const patchSong = vi.fn();

      const res = await MobileOfflineService.downloadSongForOffline(song, patchSong);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Bài hát không có địa chỉ phát trực tuyến hợp lệ');
      expect(patchSong).not.toHaveBeenCalled();
    });

    it('downloads audio and cover art, then updates song record with isOffline true', async () => {
      const song: Song = {
        id: 'song-off-1',
        title: 'Offline Song',
        artist: 'Offline Artist',
        artists: ['Offline Artist'],
        album: 'Offline Album',
        duration: 200,
        genre: 'Acoustic',
        year: 2026,
        filePath: 'http://server:4545/api/stream/song-off-1',
        streamUrl: 'http://server:4545/api/stream/song-off-1',
        coverArt: 'http://server:4545/api/cover/song-off-1',
        sourceType: 'stream',
      };

      const mockAudioBytes = new Uint8Array([1, 2, 3, 4]);
      const mockCoverBytes = new Uint8Array([9, 8, 7]);

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('cover')) {
          return Promise.resolve({
            ok: true,
            arrayBuffer: async () => mockCoverBytes.buffer,
          } as unknown as Response);
        }
        return Promise.resolve({
          ok: true,
          arrayBuffer: async () => mockAudioBytes.buffer,
        } as unknown as Response);
      });

      const patchSong = vi.fn().mockResolvedValue(song);

      const res = await MobileOfflineService.downloadSongForOffline(song, patchSong);
      expect(res.ok).toBe(true);
      expect(res.localUri).toContain('song-off-1.mp3');

      expect(patchSong).toHaveBeenCalledWith('song-off-1', {
        isOffline: true,
        localOfflinePath: expect.stringContaining('song-off-1.mp3'),
        filePath: expect.stringContaining('song-off-1.mp3'),
        coverArt: expect.stringContaining('song-off-1_cover.jpg'),
        fileSize: 4,
      });
    });
  });

  describe('removeOfflineSong', () => {
    it('deletes offline files and restores stream URL', async () => {
      const song: Song = {
        id: 'song-off-2',
        title: 'Offline Song 2',
        artist: 'Offline Artist',
        artists: ['Offline Artist'],
        album: 'Offline Album',
        duration: 180,
        genre: 'Rock',
        year: 2026,
        coverArt: null,
        filePath: 'mock-doc-path/melovista/offline/song-off-2.mp3',
        streamUrl: 'http://server:4545/api/stream/song-off-2',
        isOffline: true,
        localOfflinePath: 'mock-doc-path/melovista/offline/song-off-2.mp3',
      };

      const patchSong = vi.fn().mockResolvedValue(song);

      const res = await MobileOfflineService.removeOfflineSong(song, patchSong);
      expect(res.ok).toBe(true);

      expect(patchSong).toHaveBeenCalledWith('song-off-2', {
        isOffline: false,
        localOfflinePath: undefined,
        filePath: 'http://server:4545/api/stream/song-off-2',
      });
    });
  });

  describe('getOfflineStats', () => {
    it('computes offline track count and total bytes', () => {
      const songs: Song[] = [
        { id: '1', isOffline: true, fileSize: 10 * 1024 * 1024 } as Song,
        { id: '2', isOffline: true, fileSize: 20 * 1024 * 1024 } as Song,
        { id: '3', isOffline: false, fileSize: 15 * 1024 * 1024 } as Song,
      ];

      const stats = MobileOfflineService.getOfflineStats(songs);
      expect(stats.count).toBe(2);
      expect(stats.totalSizeBytes).toBe(30 * 1024 * 1024);
      expect(stats.formattedSize).toBe('30.0 MB');
    });
  });
});
