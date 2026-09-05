import { ServerClient } from '@music/core';
import type { Song } from '@music/types';

export interface FailedUploadItem {
  songId: string;
  songTitle: string;
  error: string;
}

export interface UploadProgressState {
  status: 'idle' | 'diffing' | 'uploading' | 'completed' | 'cancelled' | 'error';
  total: number;
  current: number;
  currentSongTitle: string;
  speedMb: number;
  percent: number;
  skippedCount: number;
  uploadedCount: number;
  failedCount: number;
  failedSongs?: FailedUploadItem[];
  error?: string;
}

export interface UploadSummary {
  total: number;
  uploadedCount: number;
  skippedCount: number;
  failedCount: number;
  failedSongs?: FailedUploadItem[];
  cancelled: boolean;
  error?: string;
}

export class ServerUploadService {
  private static instance: ServerUploadService;

  public static getInstance(): ServerUploadService {
    if (!ServerUploadService.instance) {
      ServerUploadService.instance = new ServerUploadService();
    }
    return ServerUploadService.instance;
  }

  public async pushSongs(
    serverUrl: string,
    allSongs: Song[],
    onProgress: (state: UploadProgressState) => void,
    signal?: { aborted: boolean }
  ): Promise<UploadSummary> {
    const cleanUrl = ServerClient.normalizeUrl(serverUrl);
    if (!cleanUrl) {
      const err = 'Địa chỉ máy chủ không hợp lệ';
      onProgress({
        status: 'error',
        total: 0,
        current: 0,
        currentSongTitle: '',
        speedMb: 0,
        percent: 0,
        skippedCount: 0,
        uploadedCount: 0,
        failedCount: 0,
        error: err,
      });
      return { total: 0, uploadedCount: 0, skippedCount: 0, failedCount: 0, cancelled: false, error: err };
    }

    // Filter only local files that have a physical path on disk
    const localSongs = allSongs.filter(
      (s) => s.sourceType !== 'stream' && !!s.filePath && !s.filePath.startsWith('http')
    );

    if (localSongs.length === 0) {
      onProgress({
        status: 'completed',
        total: 0,
        current: 0,
        currentSongTitle: '',
        speedMb: 0,
        percent: 100,
        skippedCount: 0,
        uploadedCount: 0,
        failedCount: 0,
      });
      return { total: 0, uploadedCount: 0, skippedCount: 0, failedCount: 0, cancelled: false };
    }

    // Step 1: Diffing (Audio Fingerprint + Metadata Matching)
    onProgress({
      status: 'diffing',
      total: localSongs.length,
      current: 0,
      currentSongTitle: 'Đang kiểm tra vân tay âm thanh và đối chiếu thư viện...',
      speedMb: 0,
      percent: 5,
      skippedCount: 0,
      uploadedCount: 0,
      failedCount: 0,
    });

    const diffRes = await ServerClient.checkLibraryDiff(cleanUrl, localSongs);
    if (!diffRes.ok || !diffRes.diff) {
      const err = diffRes.error || 'Không thể kiểm tra sai khác với máy chủ';
      onProgress({
        status: 'error',
        total: localSongs.length,
        current: 0,
        currentSongTitle: '',
        speedMb: 0,
        percent: 0,
        skippedCount: 0,
        uploadedCount: 0,
        failedCount: 0,
        error: err,
      });
      return { total: localSongs.length, uploadedCount: 0, skippedCount: 0, failedCount: 0, cancelled: false, error: err };
    }

    const { toUploadIds, alreadyExists } = diffRes.diff;
    const toUploadSongs = localSongs.filter((s) => toUploadIds.includes(s.id));
    const skippedCount = alreadyExists.length;

    if (toUploadSongs.length === 0) {
      onProgress({
        status: 'completed',
        total: localSongs.length,
        current: localSongs.length,
        currentSongTitle: 'Tất cả bài hát đã có sẵn trên máy chủ (Khớp vân tay)',
        speedMb: 0,
        percent: 100,
        skippedCount,
        uploadedCount: 0,
        failedCount: 0,
      });
      return { total: localSongs.length, uploadedCount: 0, skippedCount, failedCount: 0, cancelled: false };
    }

    // Step 2: Batch Uploading via Stream IPC
    let uploadedCount = 0;
    let failedCount = 0;
    const failedSongs: FailedUploadItem[] = [];
    const totalToUpload = toUploadSongs.length;

    // Listen to chunk-level progress from Electron
    let currentSpeed = 0;
    const unbindProgress = window.electronAPI.onUploadProgress((data) => {
      currentSpeed = data.speedMb;
    });

    try {
      for (let i = 0; i < toUploadSongs.length; i++) {
        if (signal?.aborted) {
          unbindProgress();
          onProgress({
            status: 'cancelled',
            total: localSongs.length,
            current: uploadedCount,
            currentSongTitle: 'Đã hủy quá trình đẩy nhạc',
            speedMb: 0,
            percent: Math.round(((skippedCount + uploadedCount) / localSongs.length) * 100),
            skippedCount,
            uploadedCount,
            failedCount,
            failedSongs,
          });
          return { total: localSongs.length, uploadedCount, skippedCount, failedCount, failedSongs, cancelled: true };
        }

        const song = toUploadSongs[i];
        const overallPercent = Math.round(
          ((skippedCount + i) / localSongs.length) * 100
        );

        onProgress({
          status: 'uploading',
          total: localSongs.length,
          current: i + 1,
          currentSongTitle: `${song.title} - ${song.artist}`,
          speedMb: currentSpeed,
          percent: overallPercent,
          skippedCount,
          uploadedCount,
          failedCount,
          failedSongs,
        });

        const res = await window.electronAPI.uploadSongToServer({
          serverUrl: cleanUrl,
          song,
        });

        if (res.success) {
          uploadedCount++;
        } else {
          failedCount++;
          const errDetail = res.error || 'Lỗi không xác định khi tải lên';
          failedSongs.push({
            songId: song.id,
            songTitle: song.title || 'Bài hát không tên',
            error: errDetail,
          });
          console.warn(`[ServerUploadService] Failed to upload ${song.title}:`, errDetail);
        }
      }
    } finally {
      unbindProgress();
    }

    onProgress({
      status: 'completed',
      total: localSongs.length,
      current: totalToUpload,
      currentSongTitle: 'Hoàn tất quá trình đồng bộ',
      speedMb: 0,
      percent: 100,
      skippedCount,
      uploadedCount,
      failedCount,
      failedSongs,
    });

    return {
      total: localSongs.length,
      uploadedCount,
      skippedCount,
      failedCount,
      failedSongs,
      cancelled: false,
    };
  }

  public async uploadSingleSong(
    serverUrl: string,
    song: Song
  ): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
    const cleanUrl = ServerClient.normalizeUrl(serverUrl);
    if (!cleanUrl) return { success: false, error: 'Invalid server URL' };
    if (!song.filePath || song.filePath.startsWith('http') || song.sourceType === 'stream') {
      return { success: false, error: 'Not a local file' };
    }

    try {
      // Check diff first to avoid redundant upload if already on server
      const diffRes = await ServerClient.checkLibraryDiff(cleanUrl, [song]);
      if (diffRes.ok && diffRes.diff && diffRes.diff.alreadyExists.length > 0) {
        return { success: true, skipped: true };
      }

      const res = await window.electronAPI.uploadSongToServer({
        serverUrl: cleanUrl,
        song,
      });
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
