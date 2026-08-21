import { spawn } from 'node:child_process';
import type { Readable } from 'node:stream';
import path from 'node:path';
import fs from 'node:fs';
import type { BaseExtractor, ExtractorResult, TrackMetadata } from './BaseExtractor.js';

export class YoutubeExtractor implements BaseExtractor {
  public name = 'youtube';
  private ytDlpPath: string;
  private cookiesPath?: string;

  constructor(cookiesPath?: string) {
    this.cookiesPath = cookiesPath;
    this.ytDlpPath = this.resolveYtDlpBinary();
  }

  private resolveYtDlpBinary(): string {
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp';

    const candidates = [
      // 1. Resources folder in desktop app
      path.resolve(process.cwd(), '../desktop/resources/bin', binaryName),
      path.resolve(process.cwd(), 'apps/desktop/resources/bin', binaryName),
      // 2. Local bin folder in bot
      path.resolve(process.cwd(), 'bin', binaryName),
      // 3. System PATH fallback
      binaryName,
    ];

    for (const candidate of candidates) {
      if (candidate !== binaryName && fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return binaryName;
  }

  public validate(query: string): boolean {
    // Luôn sẵn sàng xử lý cả URL YouTube lẫn từ khóa tìm kiếm
    return (
      query.startsWith('http://') ||
      query.startsWith('https://') ||
      query.length > 0
    );
  }

  public async extract(query: string, requestedBy?: string): Promise<ExtractorResult> {
    const isUrl = query.startsWith('http://') || query.startsWith('https://');
    const target = isUrl ? query : `ytsearch1:${query}`;

    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--quiet',
      '--no-check-certificates',
    ];

    if (isUrl && !target.includes('list=')) {
      args.push('--no-playlist');
    } else if (isUrl && target.includes('list=')) {
      args.push('--flat-playlist');
    }

    if (this.cookiesPath && fs.existsSync(this.cookiesPath)) {
      args.push('--cookies', this.cookiesPath);
    }

    args.push(target);

    return new Promise((resolve, reject) => {
      const proc = spawn(this.ytDlpPath, args, { shell: false });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0 || !stdout.trim()) {
          return reject(
            new Error(stderr || `Không thể trích xuất thông tin bài hát từ YouTube (code ${code})`)
          );
        }

        try {
          const raw = JSON.parse(stdout);
          const tracks: TrackMetadata[] = [];

          // Xử lý Playlist hoặc Search List
          if (raw._type === 'playlist' && Array.isArray(raw.entries)) {
            for (const entry of raw.entries) {
              if (entry && entry.id) {
                tracks.push(this.formatEntry(entry, requestedBy));
              }
            }
            return resolve({
              tracks,
              playlistTitle: raw.title || 'YouTube Playlist',
            });
          }

          // Xử lý bài đơn
          tracks.push(this.formatEntry(raw, requestedBy));
          return resolve({ tracks });
        } catch (parseErr) {
          reject(new Error(`Lỗi phân tích cú pháp dữ liệu YouTube: ${String(parseErr)}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Không thể khởi chạy yt-dlp: ${err.message}`));
      });
    });
  }

  private formatEntry(entry: Record<string, unknown>, requestedBy?: string): TrackMetadata {
    const thumbnails = entry.thumbnails as Array<{ url: string }> | undefined;
    return {
      id: String(entry.id || ''),
      title: String(entry.title || 'Unknown Title'),
      artist: String(entry.uploader || entry.channel || entry.artist || 'YouTube Artist'),
      album: String(entry.album || 'YouTube Music'),
      duration: Math.round(Number(entry.duration) || 0),
      thumbnail: (entry.thumbnail as string) || (thumbnails && thumbnails[0]?.url) || undefined,
      url: (entry.webpage_url as string) || `https://www.youtube.com/watch?v=${entry.id}`,
      source: 'youtube',
      requestedBy,
    };
  }

  public async createStream(track: TrackMetadata): Promise<Readable> {
    const args = [
      '-o', '-',
      '-f', 'bestaudio/best',
      '--quiet',
      '--no-warnings',
    ];

    if (this.cookiesPath && fs.existsSync(this.cookiesPath)) {
      args.push('--cookies', this.cookiesPath);
    }

    args.push(track.url);

    const proc = spawn(this.ytDlpPath, args, { shell: false });

    proc.stderr.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();
      if (msg.includes('ERROR') || msg.includes('Forbidden')) {
        console.error(`[YoutubeExtractor Stream Error] ${msg}`);
      }
    });

    return proc.stdout;
  }
}
