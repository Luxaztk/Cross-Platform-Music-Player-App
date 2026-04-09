import { create as createYoutubeDl } from 'youtube-dl-exec';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { EventEmitter } from 'events';
import { app } from 'electron';
import path from 'node:path';

const isDev = !app.isPackaged;
const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

// In Production, binaries are unpacked from ASAR into app.asar.unpacked
const binaryPath = isDev
  ? path.join(process.cwd(), 'node_modules/youtube-dl-exec/bin', binName)
  : path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/youtube-dl-exec/bin', binName);

console.log('[YoutubeDownloader] yt-dlp path:', binaryPath);
const youtubedl = createYoutubeDl(binaryPath);

export interface YoutubeInfo {
  id: string;
  title: string;
  thumbnail: string;
  artist: string;
  album: string;
  duration: number;
}

export class YoutubeDownloader extends EventEmitter {
  constructor() {
    super();
  }

  public async getInfo(url: string): Promise<YoutubeInfo> {
    try {
      const info: any = await youtubedl(url, {
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
      });

      return {
        id: info.id,
        title: info.title || info.fulltitle || 'Unknown Title',
        thumbnail: info.thumbnail || '',
        artist: info.channel || info.uploader || 'Unknown Artist',
        album: 'YouTube Download',
        duration: info.duration || 0,
      };
    } catch (error) {
      console.error('Failed to get YouTube info:', error);
      throw error;
    }
  }

  public async downloadAudio(url: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;

      const subprocess = youtubedl.exec(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: 0, // Best quality (VBR)
        output: outputPath,
        ffmpegLocation: ffmpegPath.path,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        noPlaylist: true,
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        ]
      });

      // MUST consume stdout for progress
      subprocess.stdout?.on('data', (data) => {
        const text = data.toString();
        const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          this.emit('progress', percent);
        }
      });

      // MUST consume stderr — otherwise the buffer fills up and the process hangs
      subprocess.stderr?.on('data', (data) => {
        console.log('[yt-dlp stderr]', data.toString().trim());
      });

      subprocess.on('close', (code) => {
        if (settled) return;
        settled = true;
        if (code === 0) {
          console.log('[yt-dlp] Download completed successfully:', outputPath);
          resolve(outputPath);
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      subprocess.on('error', (err) => {
        if (settled) return;
        settled = true;
        console.error('[yt-dlp] Process error:', err);
        reject(err);
      });
    });
  }
}
