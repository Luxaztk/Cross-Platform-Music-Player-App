import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerUploadService, type UploadProgressState } from '@infrastructure/services/ServerUploadService';
import { ServerClient } from '@music/core';
import type { Song } from '@music/types';

vi.mock('@music/core', () => ({
  ServerClient: {
    normalizeUrl: vi.fn((url: string) => {
      const trimmed = (url || '').trim().replace(/\/+$/, '');
      return trimmed || null;
    }),
    checkLibraryDiff: vi.fn(),
  },
}));

describe('ServerUploadService', () => {
  const service = ServerUploadService.getInstance();

  const mockSong1: Song = {
    id: 's1',
    filePath: 'C:\\Music\\song1.mp3',
    title: 'Song 1',
    artist: 'Artist 1',
    artists: ['Artist 1'],
    album: 'Album 1',
    duration: 200,
    genre: 'Pop',
    year: 2026,
    coverArt: null,
    hash: 'p2:abc123456789',
    sourceType: 'local',
  };

  const mockSong2: Song = {
    id: 's2',
    filePath: 'C:\\Music\\song2.flac',
    title: 'Song 2',
    artist: 'Artist 2',
    artists: ['Artist 2'],
    album: 'Album 2',
    duration: 240,
    genre: 'Rock',
    year: 2026,
    coverArt: null,
    hash: 'p2:def987654321',
    sourceType: 'local',
  };

  const streamSong: Song = {
    id: 's3',
    filePath: 'http://server/api/stream/s3',
    title: 'Stream Song',
    artist: 'Server Artist',
    artists: ['Server Artist'],
    album: 'Server Album',
    duration: 180,
    genre: 'Electronic',
    year: 2026,
    coverArt: null,
    sourceType: 'stream',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    window.electronAPI = {
      uploadSongToServer: vi.fn().mockResolvedValue({ success: true }),
      onUploadProgress: vi.fn().mockReturnValue(() => {}),
    } as unknown as typeof window.electronAPI;
  });

  describe('pushSongs', () => {
    it('returns error when server URL is invalid', async () => {
      const onProgress = vi.fn();
      const summary = await service.pushSongs('', [mockSong1], onProgress);

      expect(summary.error).toBe('Địa chỉ máy chủ không hợp lệ');
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: 'Địa chỉ máy chủ không hợp lệ',
        })
      );
    });

    it('completes immediately if there are no local physical songs', async () => {
      const onProgress = vi.fn();
      const summary = await service.pushSongs('http://localhost:4545', [streamSong], onProgress);

      expect(summary.total).toBe(0);
      expect(summary.uploadedCount).toBe(0);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          percent: 100,
        })
      );
    });

    it('performs diffing and uploads only missing songs', async () => {
      const progressStates: UploadProgressState[] = [];
      const onProgress = (s: UploadProgressState) => progressStates.push({ ...s });

      vi.mocked(ServerClient.checkLibraryDiff).mockResolvedValueOnce({
        ok: true,
        diff: {
          toUploadIds: ['s1'],
          alreadyExists: [
            {
              localId: 's2',
              serverId: 'server-s2',
              matchReason: 'HASH',
            },
          ],
        },
      });

      const summary = await service.pushSongs(
        'http://localhost:4545',
        [mockSong1, mockSong2, streamSong],
        onProgress
      );

      expect(ServerClient.checkLibraryDiff).toHaveBeenCalledWith('http://localhost:4545', [
        mockSong1,
        mockSong2,
      ]);
      expect(window.electronAPI.uploadSongToServer).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.uploadSongToServer).toHaveBeenCalledWith({
        serverUrl: 'http://localhost:4545',
        song: mockSong1,
      });

      expect(summary.total).toBe(2);
      expect(summary.uploadedCount).toBe(1);
      expect(summary.skippedCount).toBe(1);
      expect(summary.failedCount).toBe(0);
      expect(summary.cancelled).toBe(false);

      expect(progressStates.some((s) => s.status === 'diffing')).toBe(true);
      expect(progressStates.some((s) => s.status === 'uploading')).toBe(true);
      expect(progressStates.some((s) => s.status === 'completed')).toBe(true);
    });

    it('handles cancellation signal gracefully during upload loop', async () => {
      const signal = { aborted: false };

      vi.mocked(ServerClient.checkLibraryDiff).mockResolvedValueOnce({
        ok: true,
        diff: {
          toUploadIds: ['s1', 's2'],
          alreadyExists: [],
        },
      });

      // Abort after first song upload
      vi.mocked(window.electronAPI.uploadSongToServer).mockImplementationOnce(async () => {
        signal.aborted = true;
        return { success: true };
      });

      const onProgress = vi.fn();
      const summary = await service.pushSongs(
        'http://localhost:4545',
        [mockSong1, mockSong2],
        onProgress,
        signal
      );

      expect(summary.cancelled).toBe(true);
      expect(summary.uploadedCount).toBe(1);
    });

    it('records failedCount when uploadSongToServer fails', async () => {
      vi.mocked(ServerClient.checkLibraryDiff).mockResolvedValueOnce({
        ok: true,
        diff: {
          toUploadIds: ['s1'],
          alreadyExists: [],
        },
      });

      vi.mocked(window.electronAPI.uploadSongToServer).mockResolvedValueOnce({
        success: false,
        error: 'Upload timeout',
      });

      const onProgress = vi.fn();
      const summary = await service.pushSongs(
        'http://localhost:4545',
        [mockSong1],
        onProgress
      );

      expect(summary.failedCount).toBe(1);
      expect(summary.uploadedCount).toBe(0);
    });
  });

  describe('uploadSingleSong', () => {
    it('returns error if URL is invalid or song is not local', async () => {
      const res1 = await service.uploadSingleSong('', mockSong1);
      expect(res1.success).toBe(false);

      const res2 = await service.uploadSingleSong('http://localhost:4545', streamSong);
      expect(res2.success).toBe(false);
    });

    it('skips upload if song already exists on server', async () => {
      vi.mocked(ServerClient.checkLibraryDiff).mockResolvedValueOnce({
        ok: true,
        diff: {
          toUploadIds: [],
          alreadyExists: [
            {
              localId: 's1',
              serverId: 'server-s1',
              matchReason: 'HASH',
            },
          ],
        },
      });

      const res = await service.uploadSingleSong('http://localhost:4545', mockSong1);
      expect(res.success).toBe(true);
      expect(res.skipped).toBe(true);
      expect(window.electronAPI.uploadSongToServer).not.toHaveBeenCalled();
    });

    it('calls uploadSongToServer if song does not exist on server', async () => {
      vi.mocked(ServerClient.checkLibraryDiff).mockResolvedValueOnce({
        ok: true,
        diff: {
          toUploadIds: ['s1'],
          alreadyExists: [],
        },
      });

      vi.mocked(window.electronAPI.uploadSongToServer).mockResolvedValueOnce({
        success: true,
        song: mockSong1,
      });

      const res = await service.uploadSingleSong('http://localhost:4545', mockSong1);
      expect(res.success).toBe(true);
      expect(res.skipped).toBeFalsy();
      expect(window.electronAPI.uploadSongToServer).toHaveBeenCalledWith({
        serverUrl: 'http://localhost:4545',
        song: mockSong1,
      });
    });
  });
});
