import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Song, SongChapter } from '@music/types';
import { getFixedFfmpegPath } from '../../utils/ffmpegPath';

export interface ExportChaptersResult {
  success: boolean;
  exportedCount: number;
  error?: string;
}

export class ChapterExportService {
  /**
   * Export chapters of a song as individual audio files (.mp3) into targetDir.
   */
  public static async exportChapters(
    song: Song,
    chapters: SongChapter[],
    targetDir: string
  ): Promise<ExportChaptersResult> {
    if (!song.filePath || !fs.existsSync(song.filePath)) {
      return { success: false, exportedCount: 0, error: 'Source audio file not found on disk.' };
    }

    if (!chapters || chapters.length === 0) {
      return { success: false, exportedCount: 0, error: 'No chapters available to export.' };
    }

    const sortedChapters = [...chapters].sort((a, b) => a.startTime - b.startTime);
    const ffmpegPath = getFixedFfmpegPath();

    if (!fs.existsSync(ffmpegPath)) {
      return { success: false, exportedCount: 0, error: `FFmpeg binary not found at: ${ffmpegPath}` };
    }

    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    let exportedCount = 0;

    for (let idx = 0; idx < sortedChapters.length; idx++) {
      const ch = sortedChapters[idx];
      const trackNum = idx + 1;
      const paddedTrack = String(trackNum).padStart(2, '0');
      const safeTitle = (ch.title || `Track ${trackNum}`).replace(/[<>:"/\\|?*]+/g, '_').trim();
      const safeArtist = ch.artist ? ch.artist.replace(/[<>:"/\\|?*]+/g, '_').trim() : '';
      const filename = safeArtist
        ? `${paddedTrack} - ${safeArtist} - ${safeTitle}.mp3`
        : `${paddedTrack} - ${safeTitle}.mp3`;
      const outputPath = path.join(targetDir, filename);

      // Calculate slice duration
      let duration: number | undefined;
      if (typeof ch.endTime === 'number' && ch.endTime > ch.startTime) {
        duration = ch.endTime - ch.startTime;
      } else if (idx < sortedChapters.length - 1) {
        duration = sortedChapters[idx + 1].startTime - ch.startTime;
      } else if (typeof song.duration === 'number' && song.duration > ch.startTime) {
        duration = song.duration - ch.startTime;
      }

      const isMp3Source = path.extname(song.filePath).toLowerCase() === '.mp3';
      const chapterArtist = ch.artist || song.artist;

      try {
        let ok = false;
        // Attempt fast stream-copy if source is already MP3
        if (isMp3Source) {
          ok = await this.runFfmpegSlice(ffmpegPath, song.filePath, outputPath, ch.startTime, duration, {
            title: ch.title,
            artist: chapterArtist,
            album: song.album || song.title,
            track: `${trackNum}/${sortedChapters.length}`,
          }, true);
        }

        // Fallback to high quality re-encode (320kbps MP3) if stream-copy fails or non-mp3 source
        if (!ok) {
          ok = await this.runFfmpegSlice(ffmpegPath, song.filePath, outputPath, ch.startTime, duration, {
            title: ch.title,
            artist: chapterArtist,
            album: song.album || song.title,
            track: `${trackNum}/${sortedChapters.length}`,
          }, false);
        }

        if (ok) {
          exportedCount++;
        }
      } catch (sliceErr) {
        console.error(`[ChapterExportService] Failed to export chapter "${ch.title}":`, sliceErr);
      }
    }

    return {
      success: exportedCount > 0,
      exportedCount,
      error: exportedCount === 0 ? 'Failed to export any chapters.' : undefined,
    };
  }

  private static runFfmpegSlice(
    ffmpegPath: string,
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number | undefined,
    metadata: { title: string; artist?: string; album?: string; track: string },
    streamCopy: boolean
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const args = [
        '-y',
        '-ss', String(startTime),
        ...(duration && duration > 0 ? ['-t', String(duration)] : []),
        '-i', inputPath,
        ...(streamCopy ? ['-c', 'copy'] : ['-c:a', 'libmp3lame', '-b:a', '320k']),
        '-metadata', `title=${metadata.title}`,
        '-metadata', `track=${metadata.track}`,
        ...(metadata.artist ? ['-metadata', `artist=${metadata.artist}`] : []),
        ...(metadata.album ? ['-metadata', `album=${metadata.album}`] : []),
        outputPath,
      ];

      const proc = spawn(ffmpegPath, args);
      let stderr = '';

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(true);
        } else {
          console.warn(`[ChapterExportService] FFmpeg exited with code ${code}. Stderr: ${stderr.slice(-300)}`);
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        console.error('[ChapterExportService] FFmpeg spawn error:', err);
        resolve(false);
      });
    });
  }
}
