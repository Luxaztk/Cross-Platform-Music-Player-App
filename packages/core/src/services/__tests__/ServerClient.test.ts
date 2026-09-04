import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerClient } from '../ServerClient';

describe('ServerClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('normalizeUrl', () => {
    it('handles empty and whitespace-only URLs', () => {
      expect(ServerClient.normalizeUrl('')).toBe('');
      expect(ServerClient.normalizeUrl('   ')).toBe('');
    });

    it('adds http:// if protocol is missing', () => {
      expect(ServerClient.normalizeUrl('192.168.1.185:4545')).toBe('http://192.168.1.185:4545');
      expect(ServerClient.normalizeUrl('localhost:3000')).toBe('http://localhost:3000');
    });

    it('preserves existing http:// and https://', () => {
      expect(ServerClient.normalizeUrl('https://homelab.local')).toBe('https://homelab.local');
      expect(ServerClient.normalizeUrl('http://10.0.0.5:8080')).toBe('http://10.0.0.5:8080');
    });

    it('strips trailing slashes', () => {
      expect(ServerClient.normalizeUrl('http://localhost:4545/')).toBe('http://localhost:4545');
      expect(ServerClient.normalizeUrl('http://localhost:4545///')).toBe('http://localhost:4545');
    });
  });

  describe('checkHealth', () => {
    it('returns error when url is invalid', async () => {
      const result = await ServerClient.checkHealth('');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('URL không hợp lệ');
    });

    it('returns health data when server responds 200 with status ok', async () => {
      const mockHealth = {
        status: 'ok',
        service: 'melovista-streaming-server',
        version: '1.0.0',
        uptime: 120,
        totalSongs: 42,
        memoryUsage: { heapUsedMb: 25, rssMb: 45 },
        timestamp: 1234567890,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockHealth,
      } as unknown as Response);

      const result = await ServerClient.checkHealth('http://192.168.1.185:4545');
      expect(result.ok).toBe(true);
      expect(result.health).toEqual(mockHealth);
    });

    it('returns error when server responds with non-200 code', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
      } as unknown as Response);

      const result = await ServerClient.checkHealth('http://192.168.1.185:4545');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('502');
    });

    it('returns error when network fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network connection refused'));

      const result = await ServerClient.checkHealth('http://192.168.1.185:4545');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Network connection refused');
    });
  });

  describe('fetchSongs', () => {
    it('returns songs with normalized stream URLs', async () => {
      const mockRawSongs = [
        {
          id: 'song-1',
          title: 'Test Song 1',
          artist: 'Artist 1',
          filePath: '/api/stream/song-1',
          coverArt: '/api/cover/song-1',
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRawSongs,
      } as unknown as Response);

      const result = await ServerClient.fetchSongs('http://192.168.1.185:4545');
      expect(result.ok).toBe(true);
      expect(result.songs.length).toBe(1);
      expect(result.songs[0].sourceType).toBe('stream');
      expect(result.songs[0].filePath).toBe('http://192.168.1.185:4545/api/stream/song-1');
      expect(result.songs[0].streamUrl).toBe('http://192.168.1.185:4545/api/stream/song-1');
      expect(result.songs[0].coverArt).toBe('http://192.168.1.185:4545/api/cover/song-1');
    });

    it('handles non-array response gracefully', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: 'unexpected' }),
      } as unknown as Response);

      const result = await ServerClient.fetchSongs('http://192.168.1.185:4545');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Dữ liệu bài hát không phải danh sách mảng');
    });
  });

  describe('checkLibraryDiff', () => {
    it('returns error when baseUrl is empty', async () => {
      const result = await ServerClient.checkLibraryDiff('', []);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('URL không hợp lệ');
    });

    it('sends post request and returns diff result on success', async () => {
      const mockDiff = {
        toUploadIds: ['song-1'],
        alreadyExists: [{ localId: 'song-2', serverId: 'srv-2', matchReason: 'HASH' as const }],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDiff,
      } as unknown as Response);

      const result = await ServerClient.checkLibraryDiff('http://192.168.1.185:4545', [
        { id: 'song-1', title: 'Song 1', artist: 'Artist 1', duration: 180, hash: 'p2:abc', fileSize: 1000 },
        { id: 'song-2', title: 'Song 2', artist: 'Artist 2', duration: 200, hash: 'p2:def', fileSize: 2000 },
      ]);

      expect(result.ok).toBe(true);
      expect(result.diff).toEqual(mockDiff);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://192.168.1.185:4545/api/library/diff',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('handles server error response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as unknown as Response);

      const result = await ServerClient.checkLibraryDiff('http://192.168.1.185:4545', []);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Máy chủ phản hồi mã lỗi: 500');
    });
  });
});
