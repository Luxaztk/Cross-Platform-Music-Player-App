import * as mm from 'music-metadata';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Song } from '@music/types';
import { splitArtists } from '@music/utils';

export class MetadataService {
  static async extractMetadata(filePath: string): Promise<Song | null> {
    try {
      const metadata = await mm.parseFile(filePath);
      const { common, format } = metadata;

      let coverArt: string | null = null;
      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];
        coverArt = `data:${picture.format};base64,${Buffer.from(picture.data).toString('base64')}`;
      }

      const rawArtist = common.artist || 'Unknown Artist';
      const artists = (common.artists && common.artists.length > 0)
        ? common.artists.flatMap(a => splitArtists(a))
        : splitArtists(rawArtist);

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
        duration: format.duration || 0,
        genre: common.genre ? common.genre.join(', ') : 'Unknown Genre',
        year: common.year || null,
        coverArt,
      };
    } catch (error) {
      console.error(`Error extracting metadata for ${filePath}:`, error);
      return null;
    }
  }
}
