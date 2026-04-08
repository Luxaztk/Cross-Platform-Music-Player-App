import * as mm from 'music-metadata';
import path from 'node:path';
import NodeID3 from 'node-id3';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'node:fs/promises';
import type { Song } from '@music/types';
import { splitArtists } from '@music/utils';

export class MainMetadataService {
  /**
   * Calculates a "Perceptual" audio fingerprint (v2) by computing the Energy Envelope.
   * This is extremely stable across different qualities (bitrates) and encoders.
   */
  public static async calculateAudioHash(filePath: string): Promise<string> {
    const runFfmpeg = (offset: number): Promise<Buffer> => {
      return new Promise((resolve) => {
        const ffmpeg = spawn(ffmpegPath.path, [
          '-ss', offset.toString(),
          '-t', '30',
          '-i', filePath,
          '-f', 's16le',
          '-ac', '1',
          '-ar', '8000',
          '-loglevel', 'error',
          '-'
        ]);

        let pcmData = Buffer.alloc(0);
        ffmpeg.stdout.on('data', (chunk) => { pcmData = Buffer.concat([pcmData, chunk]); });
        ffmpeg.on('close', (code) => {
          if (code === 0) resolve(pcmData);
          else resolve(Buffer.alloc(0));
        });
        ffmpeg.on('error', () => resolve(Buffer.alloc(0)));
      });
    };

    // Try at 30s offset first (to avoid silence at start)
    let pcm = await runFfmpeg(30);
    
    // If it failed or the song is shorter than 30s (no data), fallback to 0s
    if (pcm.length === 0) {
      pcm = await runFfmpeg(0);
    }

    if (pcm.length === 0) {
      return `error-fallback-v2-${Date.now()}`;
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
    
    return `p2:${envelope.join('')}`;
  }

  static async extractMetadata(filePath: string, sourceUrl?: string, originId?: string): Promise<Song | null> {
    try {
      const stats = await fs.stat(filePath);
      const metadata = await mm.parseFile(filePath);
      const { common, format } = metadata;

      let coverArt: string | null = null;
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        coverArt = `data:${picture.format};base64,${Buffer.from(picture.data).toString('base64')}`;
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
              plainLyrics = tags.unsynchronisedLyrics[0]?.text;
            } else {
              plainLyrics = (tags.unsynchronisedLyrics as any).text;
            }
          }
        }
      } catch (e) {
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
      console.error(`Error extracting metadata for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Updates the physical file's metadata (ID3 tags) based on the Song object.
   */
  static async updatePhysicalMetadata(song: Song): Promise<boolean> {
    try {
      const { MetadataManager } = require('../modules/metadata/MetadataManager');
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
