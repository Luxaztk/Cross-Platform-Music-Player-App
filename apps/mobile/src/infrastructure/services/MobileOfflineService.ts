import { File, Directory, Paths } from 'expo-file-system';
import type { Song } from '@music/types';

function safeFileName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class MobileOfflineService {
  private static getOfflineDir(): Directory {
    const dir = new Directory(Paths.document, 'melovista/offline');
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
    return dir;
  }

  /**
   * Checks if a song is downloaded and exists locally on disk.
   */
  static isSongOffline(song: Song): boolean {
    if (!song || !song.isOffline || !song.localOfflinePath) {
      return false;
    }
    try {
      const file = new File(song.localOfflinePath);
      return file.exists || file.info().exists;
    } catch {
      return false;
    }
  }

  /**
   * Downloads a stream song into permanent offline storage (Paths.document/melovista/offline)
   * and updates the song record via patchSong.
   */
  static async downloadSongForOffline(
    song: Song,
    patchSong: (id: string, updates: Partial<Song>) => Promise<Song | null>
  ): Promise<{ ok: boolean; localUri?: string; error?: string }> {
    const streamUrl = song.streamUrl || song.filePath;
    if (!streamUrl || !/^https?:\/\//i.test(streamUrl)) {
      return { ok: false, error: 'Bài hát không có địa chỉ phát trực tuyến hợp lệ' };
    }

    const offlineDir = this.getOfflineDir();
    const safeId = safeFileName(song.id);
    const destAudioFile = new File(offlineDir, `${safeId}.mp3`);
    const tmpAudioFile = new File(offlineDir, `${safeId}.tmp`);

    try {
      // 1. Download audio file with atomic write
      const response = await fetch(streamUrl);
      if (!response.ok) {
        return { ok: false, error: `Máy chủ phản hồi mã lỗi: ${response.status}` };
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.byteLength === 0) {
        return { ok: false, error: 'Dữ liệu âm thanh tải về bị trống' };
      }

      tmpAudioFile.write(bytes);
      destAudioFile.write(bytes);

      try {
        tmpAudioFile.delete();
      } catch {
        // ignore
      }

      // 2. Download cover art if available remotely
      let localCoverUri = song.coverArt;
      if (song.coverArt && /^https?:\/\//i.test(song.coverArt)) {
        try {
          const coverRes = await fetch(song.coverArt);
          if (coverRes.ok) {
            const coverBuffer = await coverRes.arrayBuffer();
            const coverBytes = new Uint8Array(coverBuffer);
            if (coverBytes.byteLength > 0) {
              const destCoverFile = new File(offlineDir, `${safeId}_cover.jpg`);
              destCoverFile.write(coverBytes);
              localCoverUri = destCoverFile.uri;
            }
          }
        } catch {
          // Cover art download failure is non-fatal
        }
      }

      // 3. Update song record in database / persistent storage
      await patchSong(song.id, {
        isOffline: true,
        localOfflinePath: destAudioFile.uri,
        filePath: destAudioFile.uri,
        coverArt: localCoverUri,
        fileSize: bytes.byteLength,
      });

      return { ok: true, localUri: destAudioFile.uri };
    } catch (err: unknown) {
      try {
        if (tmpAudioFile.exists || tmpAudioFile.info().exists) {
          tmpAudioFile.delete();
        }
      } catch {
        // ignore
      }
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message || 'Lỗi tải bài hát về máy' };
    }
  }

  /**
   * Deletes local offline audio file and restores original stream URL.
   */
  static async removeOfflineSong(
    song: Song,
    patchSong: (id: string, updates: Partial<Song>) => Promise<Song | null>,
    originalStreamUrl?: string
  ): Promise<{ ok: boolean }> {
    const offlineDir = this.getOfflineDir();
    const safeId = safeFileName(song.id);
    const destAudioFile = new File(offlineDir, `${safeId}.mp3`);
    const destCoverFile = new File(offlineDir, `${safeId}_cover.jpg`);

    try {
      if (destAudioFile.exists || destAudioFile.info().exists) {
        destAudioFile.delete();
      }
      if (destCoverFile.exists || destCoverFile.info().exists) {
        destCoverFile.delete();
      }
    } catch {
      // ignore
    }

    const fallbackUrl = originalStreamUrl || song.streamUrl || '';

    await patchSong(song.id, {
      isOffline: false,
      localOfflinePath: undefined,
      filePath: fallbackUrl,
    });

    return { ok: true };
  }

  /**
   * Calculates total offline downloads statistics.
   */
  static getOfflineStats(songs: Song[]): {
    count: number;
    totalSizeBytes: number;
    formattedSize: string;
  } {
    const offlineSongs = (songs || []).filter((s) => s.isOffline);
    const totalSizeBytes = offlineSongs.reduce((acc, s) => acc + (s.fileSize || 0), 0);
    const formattedSize = `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

    return {
      count: offlineSongs.length,
      totalSizeBytes,
      formattedSize,
    };
  }
}
