import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileServerSyncService } from '../../../infrastructure/services/MobileServerSyncService';
import { SERVER_URL_KEY } from '../../../infrastructure/storage/keys';
import { ServerClient } from '@music/core';
import type { Song } from '@music/types';

vi.mock('@music/core', () => ({
  ServerClient: {
    normalizeUrl: vi.fn((url: string) => url.trim().replace(/\/+$/, '')),
    checkHealth: vi.fn(),
    fetchSongs: vi.fn(),
  },
}));

describe('MobileServerSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServerUrl and setServerUrl', () => {
    it('returns empty string if nothing saved', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
      const url = await MobileServerSyncService.getServerUrl();
      expect(url).toBe('');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(SERVER_URL_KEY);
    });

    it('returns saved url', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce('http://192.168.1.185:4545');
      const url = await MobileServerSyncService.getServerUrl();
      expect(url).toBe('http://192.168.1.185:4545');
    });

    it('normalizes and saves url', async () => {
      const saved = await MobileServerSyncService.setServerUrl(' http://192.168.1.185:4545/ ');
      expect(saved).toBe('http://192.168.1.185:4545');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(SERVER_URL_KEY, 'http://192.168.1.185:4545');
    });
  });

  describe('checkConnection', () => {
    it('returns error if target URL is empty', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce('');
      const res = await MobileServerSyncService.checkConnection('');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Vui lòng nhập địa chỉ máy chủ hợp lệ');
    });

    it('calls ServerClient.checkHealth and auto-saves working URL on success', async () => {
      vi.mocked(ServerClient.checkHealth).mockResolvedValueOnce({
        ok: true,
        health: {
          status: 'ok',
          service: 'melovista-streaming-server',
          version: '1.0.0',
          uptime: 300,
          totalSongs: 50,
          memoryUsage: { heapUsedMb: 5, rssMb: 10 },
          timestamp: Date.now(),
        },
      });

      const res = await MobileServerSyncService.checkConnection('http://192.168.1.185:4545');
      expect(res.ok).toBe(true);
      expect(res.health?.totalSongs).toBe(50);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(SERVER_URL_KEY, 'http://192.168.1.185:4545');
    });

    it('returns failure if ServerClient.checkHealth fails', async () => {
      vi.mocked(ServerClient.checkHealth).mockResolvedValueOnce({
        ok: false,
        error: 'Connection timed out',
      });

      const res = await MobileServerSyncService.checkConnection('http://192.168.1.185:4545');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Connection timed out');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('fetchServerSongs', () => {
    it('returns empty list and error if URL is missing', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce('');
      const res = await MobileServerSyncService.fetchServerSongs('');
      expect(res.ok).toBe(false);
      expect(res.songs).toEqual([]);
    });

    it('fetches songs using ServerClient', async () => {
      const mockSongs: Song[] = [
        {
          id: 'song-1',
          filePath: 'http://192.168.1.185:4545/api/stream/song-1',
          title: 'Track 1',
          artist: 'Artist 1',
          artists: ['Artist 1'],
          album: 'Album 1',
          duration: 210,
          genre: 'Pop',
          year: 2026,
          coverArt: null,
          sourceType: 'stream',
          streamUrl: 'http://192.168.1.185:4545/api/stream/song-1',
        },
      ];

      vi.mocked(ServerClient.fetchSongs).mockResolvedValueOnce({
        ok: true,
        songs: mockSongs,
      });

      const res = await MobileServerSyncService.fetchServerSongs('http://192.168.1.185:4545');
      expect(res.ok).toBe(true);
      expect(res.songs).toHaveLength(1);
      expect(res.songs[0].id).toBe('song-1');
    });
  });
});
