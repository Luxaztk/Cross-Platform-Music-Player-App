import { getFixedFfmpegPath } from '../../utils/ffmpegPath';
import { EventEmitter } from 'events';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import log from 'electron-log/main';
import { waitForFileUnlock } from '../../utils/fileState';
import { extractSongChapters } from '@music/utils';
import type { SongChapter, DownloadProgressPayload } from '@music/types';

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
  description?: string;
  chapters?: Array<{ start_time?: number; end_time?: number; title?: string }>;
}

export interface YoutubeInfo {
  id: string;
  title: string;
  thumbnail: string;
  artist: string;
  album: string;
  duration: number;
  chapters?: SongChapter[];
}

export interface DownloadTask {
  id: string;
  url: string;
  outputPath: string;
  resolve: (path: string) => void;
  reject: (err: Error) => void;
  subprocess?: ChildProcess;
}

export class YoutubeDownloader extends EventEmitter {
  private binaryPath: string;
  private queue: DownloadTask[] = [];
  private activeDownloads: Map<string, DownloadTask> = new Map();
  private maxConcurrent = 3;
  private progressLastEmit: Map<string, number> = new Map();
  private cookiesPath: string;

  constructor() {
    super();
    this.binaryPath = this.getYtDlpPath();
    this.cookiesPath = path.join(app.getPath('userData'), 'youtube_cookies.txt');

    if (!fs.existsSync(this.binaryPath)) {
      throw new Error(
        `\n[CRITICAL] MELOVISTA FATAL ERROR: Không tìm thấy file yt-dlp tại: ${this.binaryPath}\n` +
        `-> GIẢI PHÁP: Vui lòng tải file và đặt vào thư mục dự án theo đường dẫn: apps/desktop/resources/bin/yt-dlp.exe\n`
      );
    }

    log.info('[YoutubeDownloader] initialized with auth-ready architecture');
  }

  private getYtDlpPath(): string {
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    let resolvedPath: string;

    if (app.isPackaged) {
      resolvedPath = path.join(process.resourcesPath, 'bin', binaryName);
    } else {
      const path1 = path.join(app.getAppPath(), 'resources', 'bin', binaryName);
      const path2 = path.join(__dirname, '../../resources/bin', binaryName);
      resolvedPath = fs.existsSync(path1) ? path1 : path2;
    }

    if (resolvedPath.includes('app.asar') && !resolvedPath.includes('app.asar.unpacked')) {
      resolvedPath = resolvedPath.replace('app.asar', 'app.asar.unpacked');
    }

    return resolvedPath;
  }

  private async executeYtDlp(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
    const musicPath = app.getPath('music');
    const finalArgs = [...args];
    
    if (fs.existsSync(this.cookiesPath)) {
      finalArgs.push('--cookies', this.cookiesPath);
    }

    return new Promise((resolve) => {
      let stdoutData = '';
      let stderrData = '';
      
      const subprocess = spawn(this.binaryPath, finalArgs, {
        shell: false,
        cwd: musicPath,
        env: { ...process.env }
      });

      const timeout = setTimeout(() => {
        subprocess.kill('SIGKILL');
      }, 60000); 

      subprocess.stdout.on('data', (data) => { stdoutData += data.toString(); });
      subprocess.stderr.on('data', (data) => { stderrData += data.toString(); });

      subprocess.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ stdout: stdoutData, stderr: stderrData, code });
      });
    });
  }

  public async getInfo(url: string): Promise<YoutubeInfo> {
    const cacheDir = path.join(app.getPath('userData'), 'yt-dlp-cache');
    const ffmpegPath = getFixedFfmpegPath();

    const baseArgs = [
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
      '--referer', 'https://www.youtube.com/',
      '--extractor-args', 'youtube:player_client=android,web',
      url
    ];

    const result = await this.executeYtDlp(baseArgs);

    if (result.code === 0) {
      try {
        const info = JSON.parse(result.stdout) as YtDlpRawInfo;
        const chapters = extractSongChapters({
          rawChapters: info.chapters,
          description: info.description,
          totalDuration: info.duration,
        });

        return {
          id: info.id,
          title: info.title || info.fulltitle || 'Unknown Title',
          thumbnail: info.thumbnail || '',
          artist: info.channel || info.uploader || 'Unknown Artist',
          album: 'YouTube Download',
          duration: info.duration || 0,
          chapters: chapters.length > 0 ? chapters : undefined,
        };
      } catch {
        throw new Error('Failed to parse YouTube info.');
      }
    }

    if (result.stderr.includes('bot') || result.stderr.includes('Sign in')) {
      log.warn('[YoutubeDownloader] Auth Required detected:', url);
      this.emit('auth-required', { url });
      throw new Error('AUTH_REQUIRED');
    }

    throw new Error(`yt-dlp info failed: ${result.stderr}`);
  }

  public async getPlaylistInfo(url: string): Promise<{ title: string; items: YoutubeInfo[] }> {
    const ffmpegPath = getFixedFfmpegPath();
    const baseArgs = [
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--ffmpeg-location', path.dirname(ffmpegPath),
      '--js-runtime', process.execPath,
      '--extractor-args', 'youtube:player_client=android,web',
      url
    ];

    const result = await this.executeYtDlp(baseArgs);

    if (result.code === 0) {
      try {
        const fullInfo = JSON.parse(result.stdout);
        const playlistTitle = fullInfo.title || 'YouTube Playlist';
        const entries = (fullInfo.entries || []) as YtDlpRawInfo[];

        const items = entries.map(info => ({
          id: info.id,
          title: info.title || info.fulltitle || 'Unknown Title',
          thumbnail: info.thumbnail || (info as { thumbnails?: Array<{ url: string }> }).thumbnails?.[0]?.url || '',
          artist: info.channel || info.uploader || 'Unknown Artist',
          album: playlistTitle,
          duration: info.duration || 0,
        }));

        return { title: playlistTitle, items };
      } catch (e) {
        log.error('[YoutubeDownloader] Failed to parse Playlist JSON:', e);
        throw new Error('Failed to parse Playlist info.');
      }
    }

    if (result.stderr.includes('bot') || result.stderr.includes('Sign in')) {
      this.emit('auth-required', { url });
      throw new Error('AUTH_REQUIRED');
    }

    throw new Error(`yt-dlp playlist failed: ${result.stderr}`);
  }

  public downloadAudio(id: string, url: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const task = { id, url, outputPath, resolve, reject };
      this.queue.push(task);
      log.info('[YoutubeDownloader] Task enqueued:', { id, queueLength: this.queue.length });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.activeDownloads.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeDownloads.set(task.id, task);
    this.startDownload(task);
    
    this.processQueue();
  }

  private async startDownload(task: DownloadTask) {
    const { id, url, outputPath } = task;
    log.info(`[YoutubeDownloader] Starting download worker...`, { id, url });

    const musicPath = app.getPath('music');
    const cacheDir = path.join(app.getPath('userData'), 'yt-dlp-cache');
    const ffmpegPath = getFixedFfmpegPath();

    try {
      if (!fs.existsSync(this.binaryPath)) throw new Error(`yt-dlp missing`);
      if (!fs.existsSync(ffmpegPath)) throw new Error(`ffmpeg missing`);

      const args = [
        '--newline',
        '--force-overwrites',
        '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
        '--no-playlist', '--restrict-filenames', '--embed-thumbnail',
        '--convert-thumbnails', 'jpg', '--embed-metadata', '--no-check-certificates',
        '--no-warnings', '--prefer-free-formats',
        '--ffmpeg-location', path.dirname(ffmpegPath),
        '--js-runtime', process.execPath,
        '--cache-dir', cacheDir,
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        '--referer', 'https://www.youtube.com/',
        '--extractor-args', 'youtube:player_client=android,web',
        '-o', outputPath,
        url
      ];

      if (fs.existsSync(this.cookiesPath)) {
        args.push('--cookies', this.cookiesPath);
      }

      const subprocess = spawn(this.binaryPath, args, { 
        shell: false, 
        cwd: musicPath, 
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      task.subprocess = subprocess;

      let collectStderr = '';

      subprocess.stdout.on('data', (data: Buffer | string) => {
        const text = data.toString();

        if (text.includes('[ExtractAudio]') || text.includes('[ffmpeg]')) {
          log.debug('[YT-DLP process]:', text.trim());
          this.throttledEmitProgress(id, 100, 'converting');
        } else if (text.includes('[download]')) {
          log.debug('[YT-DLP process]:', text.trim());
        }
        
        const matches = [...text.matchAll(/\[download\]\s+(\d+\.?\d*)%/g)];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const percent = parseFloat(lastMatch[1]);
          this.throttledEmitProgress(id, percent, 'downloading');
        }
      });

      subprocess.stderr.on('data', (data) => {
        collectStderr += data.toString();
      });

      subprocess.on('close', async (code) => {
        log.info('[YoutubeDownloader] Worker closed:', { id, code });

        this.activeDownloads.delete(id);
        this.progressLastEmit.delete(id);

        if (code === 0) {
          try {
            await waitForFileUnlock(outputPath);
            task.resolve(outputPath);
          } catch (err) {
            task.reject(err as Error);
          }
        } else {
          if (collectStderr.includes('Sign in')) {
            this.emit('auth-required', { url, id });
          }
          task.reject(new Error(`yt-dlp exited with code ${code}: ${collectStderr}`));
        }
        this.processQueue();
      });

      subprocess.on('error', (err) => {
        this.activeDownloads.delete(id);
        this.progressLastEmit.delete(id);
        task.reject(err);
        this.processQueue();
      });

    } catch (err) {
      this.activeDownloads.delete(id);
      task.reject(err as Error);
      this.processQueue();
    }
  }

  private throttledEmitProgress(
    id: string, 
    percent: number, 
    stage: 'downloading' | 'converting' = 'downloading'
  ) {
    const now = Date.now();
    const last = this.progressLastEmit.get(id) || 0;
    if (stage === 'converting' || now - last > 200) {
      const payload: DownloadProgressPayload = { id, percent, stage };
      this.emit('progress', payload);
      this.progressLastEmit.set(id, now);
    }
  }

  public cancelDownload(id: string) {
    this.queue = this.queue.filter(t => t.id !== id);
    const active = this.activeDownloads.get(id);
    if (active && active.subprocess) {
      active.subprocess.kill('SIGKILL');
      this.activeDownloads.delete(id);
    }
    log.info('[YoutubeDownloader] Canceled task:', id);
    this.processQueue();
  }
}
