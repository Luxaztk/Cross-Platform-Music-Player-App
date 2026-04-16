import { getFixedFfmpegPath } from '../../utils/ffmpegPath';
import { EventEmitter } from 'events';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import log from 'electron-log/main';
import { waitForFileUnlock } from '../../utils/fileState';

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
  private binaryPath: string;

  constructor() {
    super();
    this.binaryPath = this.getYtDlpPath();

    // 3. KIỂM TRA CHẶT CHẼ (Fail-fast)
    if (!fs.existsSync(this.binaryPath)) {
      throw new Error(
        `\n[CRITICAL] MELOVISTA FATAL ERROR: Không tìm thấy file yt-dlp tại: ${this.binaryPath}\n` +
        `-> GIẢI PHÁP: Vui lòng tải file và đặt vào thư mục dự án theo đường dẫn: apps/desktop/resources/bin/yt-dlp.exe\n`
      );
    }

    console.log('[YoutubeDownloader] yt-dlp path locked at:', this.binaryPath);
  }

  /**
   * Resolves the path to the yt-dlp binary based on the environment.
   * Ensures the path points to the unpacked version if in ASAR.
   */
  private getYtDlpPath(): string {
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    let resolvedPath: string;

    if (app.isPackaged) {
      // PRODUCTION: Binary is in the resources/bin folder
      resolvedPath = path.join(process.resourcesPath, 'bin', binaryName);
    } else {
      // DEVELOPMENT: Flexible path resolution for Vite & Monorepo
      const path1 = path.join(app.getAppPath(), 'resources', 'bin', binaryName);
      const path2 = path.join(__dirname, '../../resources/bin', binaryName);
      resolvedPath = fs.existsSync(path1) ? path1 : path2;
    }

    // CRITICAL: Handle ASAR Unpacked resolution for the binary itself
    if (resolvedPath.includes('app.asar') && !resolvedPath.includes('app.asar.unpacked')) {
      resolvedPath = resolvedPath.replace('app.asar', 'app.asar.unpacked');
    }

    return resolvedPath;
  }


  public async getInfo(url: string): Promise<YoutubeInfo> {
    const musicPath = app.getPath('music');
    const cacheDir = path.join(app.getPath('userData'), 'yt-dlp-cache');
    const ffmpegPath = getFixedFfmpegPath();

    if (!fs.existsSync(this.binaryPath)) {
      throw new Error(`[yt-dlp] Binary not found at: ${this.binaryPath}`);
    }

    return new Promise((resolve, reject) => {
      let stdoutData = '';
      let stderrData = '';
      let settled = false;

      const args = [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--no-check-certificates',
        '--prefer-free-formats',
        '--no-check-formats',
        '--ffmpeg-location', path.dirname(ffmpegPath),
        '--js-runtime', process.execPath,
        '--cache-dir', cacheDir,
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '--referer', 'youtube.com',
        url
      ];

      log.info('[YT-DLP] Fetching info (spawn):', { url });
      
      const subprocess = spawn(this.binaryPath, args, {
        shell: false,
        cwd: musicPath,
        env: { ...process.env }
      });

      // 3. Strict Timeout (20 seconds)
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        log.warn('[YT-DLP] getInfo timed out after 20s. Killing process.');
        subprocess.kill('SIGKILL');
        reject(new Error('YTDL_TIMEOUT'));
      }, 20000);

      subprocess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      subprocess.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
          stderrData += text;
          log.warn('[YT-DLP getInfo stderr]:', text);
        }
      });

      subprocess.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        log.error('[YT-DLP getInfo spawn error]:', err);
        reject(err);
      });

      subprocess.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        if (code === 0) {
          try {
            const info = JSON.parse(stdoutData) as YtDlpRawInfo;
            resolve({
              id: info.id,
              title: info.title || info.fulltitle || 'Unknown Title',
              thumbnail: info.thumbnail || '',
              artist: info.channel || info.uploader || 'Unknown Artist',
              album: 'YouTube Download',
              duration: info.duration || 0,
            });
          } catch (parseErr) {
            log.error('[YT-DLP] Failed to parse stdout JSON:', parseErr);
            reject(new Error('Failed to parse YouTube info.'));
          }
        } else {
          log.error(`[YT-DLP] getInfo failed with code ${code}:`, stderrData);
          reject(new Error(`yt-dlp info failed with code ${code}`));
        }
      });
    });
  }

  public async downloadAudio(url: string, outputPath: string): Promise<string> {
    log.info('[YT-DLP] Starting download', { url, outputPath });

    const musicPath = app.getPath('music');
    const cacheDir = path.join(app.getPath('userData'), 'yt-dlp-cache');
    const ffmpegPath = getFixedFfmpegPath();

    // 1. Fail-fast binary check
    if (!fs.existsSync(this.binaryPath)) {
      throw new Error(`[yt-dlp] Binary not found at: ${this.binaryPath}`);
    }
    if (!fs.existsSync(ffmpegPath)) {
      throw new Error(`[ffmpeg] Binary not found at: ${ffmpegPath}`);
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let errorOutput = '';

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
        '--ffmpeg-location', path.dirname(ffmpegPath),
        '--js-runtime', process.execPath,
        '--cache-dir', cacheDir,
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '--referer', 'youtube.com',
        '-o', outputPath, // Absolute output path
        url
      ];

      log.warn('[DIAGNOSTIC] YT-DLP EXECUTION DATA:', {
        binary: this.binaryPath,
        args: args,
        exists: { 
          ytDlp: fs.existsSync(this.binaryPath), 
          ffmpeg: fs.existsSync(ffmpegPath) 
        },
        cwd: musicPath
      });

      log.warn('[YT-DLP] FINAL SPAWN CALL:', { binary: this.binaryPath, url: url });
      log.info('[YT-DLP process] Executable & Args:', { binary: this.binaryPath, args, cwd: musicPath });

      // V3 Secure Spawn: No Shell, Inherit Env, Safe CWD
      const subprocess = spawn(this.binaryPath, args, { 
        shell: false,
        cwd: musicPath,
        env: { ...process.env }
      });

      // MUST consume stdout for progress
      subprocess.stdout.on('data', (data: Buffer | string) => {
        const text = data.toString();

        if (text.includes('[ffmpeg]') || text.includes('[download]') || text.includes('[ExtractAudio]')) {
          log.debug('[YT-DLP process]:', text.trim());
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
        const stderrText = data.toString();
        errorOutput += stderrText;
        log.error('[YT-DLP STDERR]:', stderrText.trim());
      });

      subprocess.on('close', async (code) => {
        log.info('[YT-DLP] Process closed', { code });
        if (settled) return;
        
        if (code === 0) {
          try {
            // OS-level lock poll to ensure FFmpeg/yt-dlp has fully released the file
            await waitForFileUnlock(outputPath);
            
            settled = true;
            log.info('[yt-dlp] Download completed and file unlocked:', outputPath);
            resolve(outputPath);
          } catch (unlockErr) {
            settled = true;
            log.error('[yt-dlp] File lock timeout/error:', unlockErr);
            reject(unlockErr);
          }
        } else {
          settled = true;
          log.error('[yt-dlp] Process closed with error code:', { code, errorOutput });
          reject(new Error(`yt-dlp exited with code ${code}\n${errorOutput.trim()}`));
        }
      });

      subprocess.on('error', (err: any) => {
        if (settled) return;
        settled = true;
        log.error('[YT-DLP] CRITICAL SPAWN ERROR:', {
          code: err.code,
          path: err.path,
          message: err.message,
          stack: err.stack
        });
        
        log.error('[yt-dlp] Process error:', err);
        reject(err);
      });
    });
  }
}