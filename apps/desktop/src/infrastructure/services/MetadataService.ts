import * as mm from 'music-metadata';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto'; // Thêm createHash
import fs from 'node:fs/promises'; // Thêm fs để thao tác file
import { app } from 'electron'; // Lấy đường dẫn userData của app
import type { Song } from '@music/types';

// Định nghĩa thư mục lưu cache ảnh bìa
const COVERS_DIR = path.join(app.getPath('userData'), 'cache', 'covers');

export class MetadataService {
  static async extractMetadata(filePath: string): Promise<Song | null> {
    try {
      const metadata = await mm.parseFile(filePath);
      const { common, format } = metadata;

      let coverArt: string | null = null;

      if (common.picture && common.picture.length > 0) {
        const picture = common.picture[0];

        // 1. Đồng bộ thuật toán: Băm đường dẫn file gốc thành MD5
        const hash = createHash('md5').update(filePath).digest('hex');
        const safeFileName = `${hash}.jpg`;
        const coverPath = path.join(COVERS_DIR, safeFileName);

        // 2. Đảm bảo thư mục cache tồn tại trước khi ghi file (tránh lỗi ENOENT ở thư mục cha)
        await fs.mkdir(COVERS_DIR, { recursive: true });

        // 3. Lưu mảng byte (binary data) của ảnh trực tiếp xuống ổ cứng
        await fs.writeFile(coverPath, picture.data);

        // 4. Trả về một URL cực kỳ gọn nhẹ cho Frontend.
        // encodeURIComponent đảm bảo các đường dẫn chứa dấu cách, tiếng Việt không bị gãy URL
        coverArt = `melovista://app/${encodeURIComponent(filePath)}`;
      }

      return {
        id: randomUUID(),
        filePath,
        title: (common.title || path.basename(filePath, path.extname(filePath)))
          .replace(/[-_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        artist: common.artist || 'Unknown Artist',
        artists: common.artists || (common.artist ? [common.artist] : ['Unknown Artist']),
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