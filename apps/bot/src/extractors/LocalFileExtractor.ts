import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import * as mm from 'music-metadata';
import type { BaseExtractor, ExtractorResult, TrackMetadata } from './BaseExtractor.js';

const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.opus', '.wma'];

export class LocalFileExtractor implements BaseExtractor {
  public name = 'local';

  private cleanPath(query: string): string {
    return query.replace(/^["']|["']$/g, '').trim();
  }

  public validate(query: string): boolean {
    const targetPath = this.cleanPath(query);
    const ext = path.extname(targetPath).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext) && fs.existsSync(targetPath);
  }

  public async extract(query: string, requestedBy?: string): Promise<ExtractorResult> {
    const targetPath = this.cleanPath(query);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File nhạc cục bộ không tồn tại: ${targetPath}`);
    }

    const parsed = path.parse(targetPath);

    let title = parsed.name;
    let artist = 'Local Audio';
    let duration = 0;
    let thumbnail: string | undefined;

    // Ưu tiên đọc ID3/FLAC/Vorbis Metadata trực tiếp từ file
    try {
      const metadata = await mm.parseFile(targetPath);
      if (metadata.common.title && metadata.common.title.trim()) {
        title = metadata.common.title.trim();
      } else if (parsed.name.includes(' - ')) {
        const parts = parsed.name.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      if (metadata.common.artist && metadata.common.artist.trim()) {
        artist = metadata.common.artist.trim();
      }

      if (metadata.format.duration) {
        duration = Math.round(metadata.format.duration);
      }

      // Trích xuất Ảnh bìa album (Cover Art) nếu có
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        const base64 = Buffer.from(pic.data).toString('base64');
        const mime = pic.format || 'image/jpeg';
        thumbnail = `data:${mime};base64,${base64}`;
      }
    } catch (_err) {
      // Phương án Fallback: Tách từ tên file nếu không có ID3 tags
      if (parsed.name.includes(' - ')) {
        const parts = parsed.name.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
    }

    const track: TrackMetadata = {
      id: Buffer.from(targetPath).toString('base64').substring(0, 16),
      title,
      artist,
      duration,
      url: path.resolve(targetPath),
      thumbnail,
      source: 'local',
      requestedBy,
    };

    return { tracks: [track] };
  }

  public async createStream(track: TrackMetadata): Promise<Readable> {
    const targetPath = this.cleanPath(track.url);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File nhạc không tồn tại: ${targetPath}`);
    }
    return fs.createReadStream(targetPath);
  }
}
