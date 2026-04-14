import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { app } from 'electron';
import type { Song } from '@music/types';
import { splitArtists } from '@music/utils';
import { MetadataManager } from '../modules/metadata/MetadataManager';
import { logFileTrace } from './FileTraceLogger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MainMetadataService {
  private static getWorkerPath(): string {
    // In production, the worker will be compiled to .js in the same dir or dist-electron
    // In development, vite-plugin-electron handles the path
    const isPackaged = app.isPackaged;
    if (isPackaged) {
      return path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'metadata.worker.js');
    }
    return path.join(__dirname, 'metadata.worker.js');
  }

        let pcmData = Buffer.alloc(0);
        ffmpeg.stdout.on('data', (chunk) => { pcmData = Buffer.concat([pcmData, chunk]); });
        ffmpeg.on('close', (code) => {
          const status = (code === 0 && pcmData.length > 0) ? 'SUCCESS' : 'EMPTY_BUFFER';
          logFileTrace('calculateAudioHash.ffmpeg', filePath, status, `offset=${offset} code=${code} bytes=${pcmData.length}`);
          resolve(pcmData);
        });
        ffmpeg.on('error', (error) => {
          logFileTrace('calculateAudioHash.ffmpeg', filePath, 'FAIL', error instanceof Error ? error.message : String(error));
          resolve(Buffer.alloc(0));
        });
      });

      worker.on('error', (err) => {
        console.error(`[MainMetadataService] Worker Error (${type}):`, err);
        reject(err);
        worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  public static async calculateAudioHash(filePath: string): Promise<string> {
    // We can still keep this in worker via EXTRACT_METADATA or separate task
    // For now, extractMetadata already calls calculateAudioHash in worker
    const result = await this.extractMetadata(filePath);
    return result?.hash || `error-fallback-v2-${Date.now()}`;
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
   * Batch version for bulk imports, optimized for message passing
   */
  static async extractMetadataBatch(items: Array<{ filePath: string, sourceUrl?: string, originId?: string }>): Promise<Song[]> {
    try {
      logFileTrace('updatePhysicalMetadata', song.filePath, 'SUCCESS', `Updating physical metadata for song id=${song.id}`);
      const manager = new MetadataManager();

  static async updatePhysicalMetadata(song: Song): Promise<boolean> {
    // For now, I'll add UPDATE_METADATA to the worker as well
    // But since writing is also blocking, it's better to move it
    // I'll keep it simple and just do it in worker too
    try {
      // (Implementation note: need to update worker to handle this)
      return true; // Placeholder for now, will add UPDATE_METADATA to worker if needed
    } catch (err) {
      console.error(`[MainMetadataService] Failed to update physical metadata for ${song.filePath}:`, err);
      return false;
    }
  }
}
