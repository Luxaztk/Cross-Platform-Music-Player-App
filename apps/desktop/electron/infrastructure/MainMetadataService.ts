import * as mm from 'music-metadata';
import path from 'node:path';
import NodeID3 from 'node-id3';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { getFixedFfmpegPath } from '../utils/ffmpegPath';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Song } from '@music/types';
import { splitArtists } from '@music/utils';
import { MetadataManager } from '../modules/metadata/MetadataManager';
import { logFileTrace } from './FileTraceLogger';

// Định nghĩa cấu trúc chuẩn của một Lyrics Object từ node-id3
interface NodeID3Lyric {
  language?: string;
  text: string;
}

// "Trạm kiểm soát": Đảm bảo unknown data thực sự là NodeID3Lyric
function isNodeID3Lyric(obj: unknown): obj is NodeID3Lyric {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'text' in obj &&
    typeof (obj as Record<string, unknown>).text === 'string'
  );
}

export class MainMetadataService {
  /**
   * Calculates a "Perceptual" audio fingerprint (v2) by computing the Energy Envelope.
   * This is extremely stable across different qualities (bitrates) and encoders.
   */
  public static async calculateAudioHash(filePath: string): Promise<string> {
    // 1. Verify File Existence
    try {
      await fs.access(filePath);
    } catch (err) {
      console.error('\x1b[31m%s\x1b[0m', `[FFmpeg Hash] CRITICAL: File does not exist: ${filePath}`);
      return `error-fallback-v2-missing-${randomUUID()}`;
    }

    // 2. Verify FFmpeg Binary
    const resolvedPath = getFixedFfmpegPath();
    console.log('\x1b[36m%s\x1b[0m', '🚀 FFmpeg Path Resolved:', resolvedPath);

    try {
      await fs.access(resolvedPath);
    } catch (err) {
      console.error('\x1b[31m%s\x1b[0m', `[FFmpeg Hash] CRITICAL: FFmpeg binary not found at: ${resolvedPath}`);
      return `error-fallback-v2-no-binary-${randomUUID()}`;
    }

    let lastStderr = '';
    const runFfmpeg = async (offset: number): Promise<Buffer> => {
      const result = await new Promise<{ pcm: Buffer; stderr: string }>((resolve) => {
        const args = [
          '-ss', offset.toString(),
          '-t', '30',
          '-i', filePath,
          '-f', 's16le',
          '-ac', '1',
          '-ar', '8000',
          '-loglevel', 'error',
          '-'
        ];

        console.log(`[FFmpeg Hash] Executing: ${resolvedPath} ${args.join(' ')}`);

        const ffmpeg = spawn(resolvedPath, args);
        let pcmData = Buffer.alloc(0);
        let stderr = '';

        ffmpeg.stdout.on('data', (chunk) => { pcmData = Buffer.concat([pcmData, chunk]); });
        ffmpeg.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

        ffmpeg.on('close', (code) => {
          if (code !== 0 || pcmData.length === 0) {
            console.error('\x1b[31m%s\x1b[0m', `[FFmpeg Hash] Failed (offset=${offset}). Code: ${code}, Bytes: ${pcmData.length}`);
          }
          const status = (code === 0 && pcmData.length > 0) ? 'SUCCESS' : 'EMPTY_BUFFER';
          logFileTrace('calculateAudioHash.ffmpeg', filePath, status, `offset=${offset} code=${code} bytes=${pcmData.length} stderr_len=${stderr.length}`);
          resolve({ pcm: pcmData, stderr });
        });

        ffmpeg.on('error', (error) => {
          const errMsg = error instanceof Error ? error.message : String(error);
          logFileTrace('calculateAudioHash.ffmpeg', filePath, 'FAIL', errMsg);
          resolve({ pcm: Buffer.alloc(0), stderr: errMsg });
        });
      });
      lastStderr = result.stderr;
      return result.pcm;
    };

    // Try at 30s offset first (to avoid silence at start)
    let pcm = await runFfmpeg(30);

    // If it failed or the song is shorter than 30s (no data), fallback to 0s
    if (pcm.length === 0) {
      pcm = await runFfmpeg(0);
    }

    if (pcm.length === 0) {
      console.error('\x1b[41m%s\x1b[0m', '!!! FFmpeg Hashing Failed !!!');
      console.error(`[Diagnostic] FFmpeg Path: ${resolvedPath}`);
      console.error(`[Diagnostic] File Exists: ${existsSync(filePath)}`);
      console.error(`[Diagnostic] Target File: ${filePath}`);
      if (lastStderr) {
        console.error(`[Diagnostic] Raw Stderr: ${lastStderr}`);
      } else {
        console.error('[Diagnostic] Stderr was empty - possible binary execution failure or EBUSY');
      }
      return `error-fallback-v2-${randomUUID()}`; // Use UUID for absolute uniqueness
    }

    // Perceptual Fingerprinting logic:
    // Divide the recorded audio into 64 temporal windows
    const numWindows = 64;
    const bytesPerSample = 2;
    const windowSize = Math.floor(pcm.length / bytesPerSample / numWindows);
    const envelope: string[] = [];

    for (let i = 0; i < numWindows; i++) {
      let sumSquare = 0;
      let actualSamples = 0;
      for (let j = 0; j < windowSize; j++) {
        const idx = (i * windowSize + j) * bytesPerSample;
        if (idx + 1 >= pcm.length) break;
        const sample = pcm.readInt16LE(idx);
        sumSquare += (sample / 32768) ** 2;
        actualSamples++;
      }
      const rms = actualSamples > 0 ? Math.sqrt(sumSquare / actualSamples) : 0;
      const charCode = Math.min(35, Math.floor(rms * 100));
      envelope.push(charCode.toString(36));
    }

    const audioHash = `p2:${envelope.join('')}`;
    console.log('\x1b[34m%s\x1b[0m', `[Hash] Generated for ${path.basename(filePath)}: ${audioHash}`);
    return audioHash;
  }

  static async extractMetadata(filePath: string, sourceUrl?: string, originId?: string): Promise<Song | null> {
    try {
      logFileTrace('extractMetadata.begin', filePath, 'SUCCESS', 'Starting metadata extraction');
      const stats = await fs.stat(filePath);
      logFileTrace('extractMetadata.stat', filePath, 'SUCCESS', `File exists, size=${stats.size}`);

      const metadata = await mm.parseFile(filePath);
      logFileTrace('extractMetadata.parseFile', filePath, 'SUCCESS', `Parsed metadata, duration=${metadata.format.duration || 0}`);
      const { common, format } = metadata;

      let coverArt: string | null = null;
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        coverArt = `data:${picture.format};base64,${Buffer.from(picture.data).toString('base64')}`;
        logFileTrace('extractMetadata.coverArt', filePath, 'SUCCESS', `Embedded image found, format=${picture.format}`);
      }

      const audioHash = await this.calculateAudioHash(filePath);

      const rawArtist = common.artist || 'Unknown Artist';
      // Always flatMap and split every element, even if already an array, 
      const artists = (common.artists && common.artists.length > 0)
        ? common.artists.flatMap(a => splitArtists(a))
        : splitArtists(rawArtist);

      // Attempt to recover originId and sourceUrl from embedded TXXX ID3 tags if not provided
      let finalOriginId = originId;
      let finalSourceUrl = sourceUrl;

      // Attempt to recover originId, sourceUrl, and lyrics from embedded ID3 tags
      let syncedLyrics: string | undefined;
      let plainLyrics: string | undefined;
      let lyricId: string | undefined;

      try {
        const tags = NodeID3.read(filePath);
        logFileTrace('extractMetadata.readID3', filePath, 'SUCCESS', 'Read ID3 tags from file');
        if (tags) {
          if (tags.userDefinedText) {
            for (const t of tags.userDefinedText) {
              if (t.description === 'melovista_origin_id' && !finalOriginId) finalOriginId = t.value;
              if (t.description === 'melovista_source_url' && !finalSourceUrl) finalSourceUrl = t.value;
              if (t.description === 'melovista_lyric_id') lyricId = t.value;
              if (t.description === 'melovista_lrc' && !syncedLyrics) syncedLyrics = t.value;
            }
          }

          if (tags.synchronisedLyrics && tags.synchronisedLyrics.length > 0) {
            // SYLT binary data is present, but we prioritize USLT or melovista_lrc string for now
          }

          if (tags.unsynchronisedLyrics) {
            // NodeID3 might return an array or single object
            if (Array.isArray(tags.unsynchronisedLyrics)) {
              const firstItem = tags.unsynchronisedLyrics[0];
              if (isNodeID3Lyric(firstItem)) {
                plainLyrics = firstItem.text;
              }
            } else if (isNodeID3Lyric(tags.unsynchronisedLyrics)) {
              plainLyrics = tags.unsynchronisedLyrics.text;
            }
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        logFileTrace('extractMetadata.readID3', filePath, 'FAIL', message);
        console.error("Failed to read ID3 tags with node-id3:", e);
      }

      return {
        id: randomUUID(),
        filePath,
        title: (common.title || path.basename(filePath, path.extname(filePath)))
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        artist: rawArtist,
        artists: artists,
        album: common.album || 'Unknown Album',
        duration: isFinite(format.duration || 0) ? (format.duration || 0) : 0,
        genre: common.genre ? common.genre.join(', ') : 'Unknown Genre',
        year: common.year || null,
        coverArt,
        hash: audioHash,
        fileSize: stats.size,
        sourceUrl: finalSourceUrl,
        originId: finalOriginId,
        lyricId: lyricId ? parseInt(lyricId) : undefined,
        lyrics: plainLyrics,
        syncedLyrics: syncedLyrics
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logFileTrace('extractMetadata', filePath, 'FAIL', message);
      console.error(`Error extracting metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Updates the physical file's metadata (ID3 tags) based on the Song object.
   */
  static async updatePhysicalMetadata(song: Song): Promise<boolean> {
    try {
      logFileTrace('updatePhysicalMetadata', song.filePath, 'SUCCESS', `Updating physical metadata for song id=${song.id}`);
      const manager = new MetadataManager();

      // Convert coverArt (Base64 Data URI) to coverPath or similar if needed
      let coverPath: string | undefined;
      let coverUrl: string | undefined;

      if (song.coverArt && song.coverArt.startsWith('data:')) {
        // Handled inside MetadataManager via DataURI checking
      } else if (song.coverArt && song.coverArt.startsWith('http')) {
        coverUrl = song.coverArt;
      } else if (song.coverArt) {
        coverPath = song.coverArt;
      }

      await manager.writeMetadata(song.filePath, {
        title: song.title,
        artist: song.artist,
        album: song.album,
        coverPath,
        coverUrl,
        coverData: song.coverArt?.startsWith('data:') ? song.coverArt : undefined,
        originId: song.originId,
        sourceUrl: song.sourceUrl,
        syncedLyrics: song.syncedLyrics,
        lyrics: song.lyrics,
        lyricId: song.lyricId?.toString()
      });

      return true;
    } catch (err) {
      console.error(`[MainMetadataService] Failed to update physical metadata for ${song.filePath}:`, err);
      return false;
    }
  }
}
