import { ipcMain, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { Transform } from 'node:stream';
import type { Song, UploadSongResponse } from '@music/types';

export function setupServerIPC(): void {
  ipcMain.handle(
    'server:uploadSong',
    async (
      _event,
      payload: {
        serverUrl: string;
        song: Song;
      }
    ): Promise<UploadSongResponse> => {
      const { serverUrl, song } = payload;
      if (!serverUrl || !song?.filePath) {
        return { success: false, error: 'Thiếu serverUrl hoặc filePath' };
      }

      if (!fs.existsSync(song.filePath)) {
        return { success: false, error: `File không tồn tại trên đĩa: ${song.filePath}` };
      }

      try {
        const cleanServerUrl = serverUrl.trim().replace(/\/+$/, '');
        const filename = path.basename(song.filePath);
        const stat = fs.statSync(song.filePath);
        const fileSize = stat.size;

        const queryParams = new URLSearchParams({
          filename,
          title: song.title || '',
          artist: song.artist || '',
          album: song.album || '',
          duration: String(song.duration || 0),
          hash: song.hash || '',
        });

        const uploadUrl = `${cleanServerUrl}/api/upload?${queryParams.toString()}`;
        const fileStream = fs.createReadStream(song.filePath);

        // Track uploaded bytes via Transform stream to prevent premature stream consumption before fetch
        let uploadedBytes = 0;
        let lastReportTime = Date.now();
        let lastReportBytes = 0;

        const progressTransform = new Transform({
          transform(chunk: Buffer, _encoding, callback) {
            uploadedBytes += chunk.length;
            const now = Date.now();
            if (now - lastReportTime >= 250 || uploadedBytes === fileSize) {
              const timeDiffSec = (now - lastReportTime) / 1000;
              const bytesDiff = uploadedBytes - lastReportBytes;
              const speedMb = timeDiffSec > 0 ? bytesDiff / 1024 / 1024 / timeDiffSec : 0;
              const percent = fileSize > 0 ? Math.round((uploadedBytes / fileSize) * 100) : 0;

              BrowserWindow.getAllWindows().forEach((w) => {
                w.webContents.send('server:uploadProgress', {
                  songId: song.id,
                  uploadedBytes,
                  totalBytes: fileSize,
                  percent,
                  speedMb: Math.round(speedMb * 10) / 10,
                });
              });

              lastReportTime = now;
              lastReportBytes = uploadedBytes;
            }
            callback(null, chunk);
          },
        });

        const bodyStream = fileStream.pipe(progressTransform);

        // Use Node global fetch with stream body and duplex: 'half'
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(fileSize),
          },
          body: bodyStream as unknown as BodyInit,
          // @ts-expect-error duplex is required in Node fetch for streams
          duplex: 'half',
        });

        if (!response.ok) {
          if (response.status === 413) {
            const sizeMb = (fileSize / 1024 / 1024).toFixed(1);
            return {
              success: false,
              error: `Tệp quá lớn (${sizeMb}MB), vượt quá giới hạn 100MB của Cloudflare Tunnel. Hãy kết nối qua IP mạng LAN (http://<IP-Homelab>:4545) để đẩy file này.`,
            };
          }
          const errText = await response.text().catch(() => '');
          return {
            success: false,
            error: `Máy chủ phản hồi mã lỗi ${response.status}: ${errText.slice(0, 150) || response.statusText}`,
          };
        }

        const data = (await response.json()) as UploadSongResponse;
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: msg || 'Lỗi kết nối khi đẩy nhạc lên server' };
      }
    }
  );
}
