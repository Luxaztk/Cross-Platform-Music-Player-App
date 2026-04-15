import { create as createYoutubeDl } from 'youtube-dl-exec';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { EventEmitter } from 'events';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getErrorMessage, logger } from '@music/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface YtDlpRawInfo {
  id: string;
  title?: string;
  fulltitle?: string;
  thumbnail?: string;
  channel?: string;
  uploader?: string;
  duration?: number;
}

export interface YoutubeInfo {
  id: string;
  title: string;
  thumbnail: string;
  artist: string;
  album: string;
  duration: number;
}

export class YoutubeDownloader extends EventEmitter {
  private ytDl: ReturnType<typeof createYoutubeDl>;
  private binaryPath: string;

  constructor() {
    super();

    // 1. Xác định tên file theo hệ điều hành
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp'; // Hỗ trợ cả Mac/Linux

    let binaryPath = '';

    // 2. Phân giải đường dẫn "Tự phục hồi" (Self-Healing Path)
    if (app.isPackaged) {
      // MÔI TRƯỜNG PRODUCTION (Khi đóng gói bằng electron-builder)
      binaryPath = path.join(process.resourcesPath, 'bin', binaryName);
    } else {
      // MÔI TRƯỜNG DEV (Xử lý linh hoạt cho Vite & Monorepo)
      const path1 = path.join(app.getAppPath(), 'resources', 'bin', binaryName);
      // Fallback phòng trường hợp Vite thay đổi __dirname trong lúc compile
      const path2 = path.join(__dirname, '../../resources/bin', binaryName);

      binaryPath = fs.existsSync(path1) ? path1 : path2;
    }

    // 3. KIỂM TRA CHẶT CHẼ (Fail-fast)
    if (!fs.existsSync(binaryPath)) {
      throw new Error(
        `\n[CRITICAL] MELOVISTA FATAL ERROR: Không tìm thấy file yt-dlp tại: ${binaryPath}\n` +
        `-> GIẢI PHÁP: Vui lòng tải file và đặt vào thư mục dự án theo đường dẫn: apps/desktop/resources/bin/${binaryName}\n`
      );
    }

    console.log('[YoutubeDownloader] yt-dlp path locked at:', binaryPath);
    this.binaryPath = binaryPath;

    // 4. Khởi tạo instance với Binary tự quản lý
    this.ytDl = createYoutubeDl(binaryPath);
  }

  private getProductionFfmpegPath(): string {
    if (app.isPackaged) {
      return ffmpegPath.path.replace('app.asar', 'app.asar.unpacked');
    }
    return ffmpegPath.path;
  }

  public async getInfo(url: string): Promise<YoutubeInfo> {
    try {
      const info = (await this.ytDl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        noPlaylist: true,
        skipDownload: true,
        noCheckFormats: true,
        noCacheDir: true,
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        ]
      })) as unknown as YtDlpRawInfo;

      if (!info || !info.id) {
        throw new Error('Could not parse YouTube video information.');
      }

      return {
        id: info.id,
        title: info.title || info.fulltitle || 'Unknown Title',
        thumbnail: info.thumbnail || '',
        artist: info.channel || info.uploader || 'Unknown Artist',
        album: 'YouTube Download',
        duration: info.duration || 0,
      };
    } catch (error) {
      console.error('Failed to get YouTube info:', getErrorMessage(error));
      throw error;
    }
  }

  public async downloadAudio(url: string, outputPath: string): Promise<string> {
    logger.info('[YT-DLP] Starting download', { url, outputPath });

    return new Promise((resolve, reject) => {
      let settled = false;

      const args = [
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '--no-playlist',
        '--restrict-filenames',
        '--embed-thumbnail',
        '--convert-thumbnails', 'jpg',
        '--embed-metadata',
        '--no-check-certificates',
        '--no-warnings',
        '--prefer-free-formats',
        '--ffmpeg-location', this.getProductionFfmpegPath(),
        '--add-header', 'referer:youtube.com',
        '--add-header', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '-o', outputPath,
        url // URL as the last argument, never shell-interpolated
      ];

      logger.debug('[YT-DLP process] Executable & Args:', { binaryPath: this.binaryPath, args });

      // Sử dụng child_process.spawn thay vì ytDl.exec để tránh shell injection
      const subprocess = spawn(this.binaryPath, args, { shell: false });

      // MUST consume stdout for progress
      subprocess.stdout.on('data', (data: Buffer | string) => {
        const text = data.toString();

        if (text.includes('[ffmpeg]') || text.includes('[download]') || text.includes('[ExtractAudio]')) {
          logger.debug('[YT-DLP process]:', text.trim());
        }
        // Cần parse progress ví dụ: [download]  10.5% of 5.00MiB
        const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          this.emit('progress', percent);
        }
      });

      // MUST consume stderr — otherwise the buffer fills up and the process hangs
      subprocess.stderr.on('data', (data: Buffer | string) => {
        console.log('[yt-dlp stderr]', data.toString().trim());
      });

      subprocess.on('close', (code) => {
        logger.info('[YT-DLP] Process closed', { code });
        if (settled) return;
        settled = true;
        if (code === 0) {
          logger.info('[yt-dlp] Download completed successfully:', outputPath);
          resolve(outputPath);
        } else {
          logger.error('[yt-dlp] Process closed with error code:', { code });
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      subprocess.on('error', (err) => {
        if (settled) return;
        settled = true;
        logger.error('[yt-dlp] Process error:', err);
        reject(err);
      });
    });
  }
}