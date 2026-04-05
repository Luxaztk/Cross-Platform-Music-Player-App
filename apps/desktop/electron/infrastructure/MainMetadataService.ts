import * as mm from 'music-metadata';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type { Song } from '@music/types';

export class MainMetadataService {
  private static async calculateQuickHash(filePath: string): Promise<string> {
    let fileHandle: any = null;
    try {
      const hash = createHash('md5');
      const stats = await fs.stat(filePath);
      const bufferSize = Math.min(stats.size, 1024 * 1024); // Max 1MB
      
      fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(bufferSize);
      await fileHandle.read(buffer, 0, bufferSize, 0);
      
      hash.update(buffer);
      return hash.digest('hex');
    } catch (err) {
      console.error(`[MainMetadataService] Hash calculation failed for ${filePath}:`, err);
      // Use file size as a fallback fingerprint component
      try {
        const stats = await fs.stat(filePath);
        return `error-fallback-${stats.size}`;
      } catch {
        return `error-fallback-unknown`;
      }
    } finally {
      if (fileHandle) await fileHandle.close();
    }
  }

  static async extractMetadata(filePath: string): Promise<Song | null> {
    try {
      const stats = await fs.stat(filePath);
      const metadata = await mm.parseFile(filePath);
      const { common, format } = metadata;

      let coverArt: string | null = null;
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        coverArt = `data:${picture.format};base64,${Buffer.from(picture.data).toString('base64')}`;
      }

      const quickHash = await this.calculateQuickHash(filePath);

      return {
        id: randomUUID(),
        filePath,
        title: (common.title || path.basename(filePath, path.extname(filePath)))
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        artist: common.artist || 'Unknown Artist',
        album: common.album || 'Unknown Album',
        duration: isFinite(format.duration || 0) ? (format.duration || 0) : 0,
        genre: common.genre ? common.genre.join(', ') : 'Unknown Genre',
        year: common.year || null,
        coverArt,
        hash: `${quickHash}-${stats.size}`, // Combined hash for higher accuracy
        fileSize: stats.size,
      };
    } catch (error) {
      console.error(`Error extracting metadata for ${filePath}:`, error);
      return null;
    }
  }
}
