import NodeID3 from 'node-id3';
import fs from 'node:fs/promises';
import { constants } from 'node:fs'; // Import constants chuẩn

export interface ID3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  lyrics?: string;
  syncedLyrics?: string;
  coverPath?: string;
  coverUrl?: string;
  coverData?: string;
  originId?: string;
  sourceUrl?: string;
  lyricId?: string;
}

export class MetadataManager {
  public async writeMetadata(filePath: string, metadata: ID3Metadata): Promise<boolean> {
    try {
      if (!filePath.toLowerCase().endsWith('.mp3')) return false;

      // Dùng constants đã import
      await fs.access(filePath, constants.W_OK);

      const tags: NodeID3.Tags = {};

      if (metadata.title) tags.title = metadata.title;
      if (metadata.artist) tags.artist = metadata.artist;
      if (metadata.album) tags.album = metadata.album;

      // Xử lý Lyrics (Tách logic USLT & SYLT)
      this.processLyrics(tags, metadata);

      // Xử lý Image (Hàm helper giúp code chính cực sạch)
      const imageBuffer = await this.resolveImageBuffer(metadata);
      if (imageBuffer) {
        tags.image = {
          mime: 'image/jpeg', // Mime sẽ được resolve thông minh hơn trong helper
          type: { id: 3, name: 'front cover' },
          description: 'Front Cover',
          imageBuffer
        };
      }

      // Xử lý User Defined Tags (Melovista tracking)
      this.processCustomTags(tags, metadata);

      const success = NodeID3.update(tags, filePath);

      if (success instanceof Error) {
        throw new Error(`NodeID3 Error: ${success.message}`);
      }

      return true;
    } catch (error) {
      // Dùng hàm getErrorMessage (giả định bạn đã có ở utils)
      console.error('[MetadataManager] writeMetadata fatal error:', error);
      throw error;
    }
  }

  /**
   * Helper: Giải quyết nguồn ảnh và trả về Buffer
   */
  private async resolveImageBuffer(metadata: ID3Metadata): Promise<Buffer | null> {
    try {
      if (metadata.coverUrl) {
        const response = await fetch(metadata.coverUrl);
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
      }

      if (metadata.coverPath) {
        return await fs.readFile(metadata.coverPath);
      }

      if (metadata.coverData?.startsWith('data:image')) {
        const base64Data = metadata.coverData.split(';base64,').pop();
        return base64Data ? Buffer.from(base64Data, 'base64') : null;
      }
    } catch {
      return null; // Fail-safe: Ảnh lỗi không làm chết luồng ghi metadata
    }
    return null;
  }

  /**
   * Helper: Xử lý logic lyrics phức tạp
   */
  private processLyrics(tags: NodeID3.Tags, metadata: ID3Metadata) {
    if (metadata.lyrics || metadata.syncedLyrics) {
      const plainText = metadata.lyrics ||
        metadata.syncedLyrics?.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();

      if (plainText) {
        tags.unsynchronisedLyrics = { language: 'eng', text: plainText };
      }
    }

    if (metadata.syncedLyrics) {
      const lines = this.parseLRC(metadata.syncedLyrics);
      if (lines.length > 0) {
        tags.synchronisedLyrics = [{
          language: 'eng',
          timeStampFormat: 2,
          contentType: 1,
          shortText: 'Lyrics',
          synchronisedText: lines
        }];
      }
    }
  }

  private processCustomTags(tags: NodeID3.Tags, metadata: ID3Metadata) {
    const customTags: Array<{ description: string, value: string }> = [];
    if (metadata.originId) customTags.push({ description: 'melovista_origin_id', value: metadata.originId });
    if (metadata.sourceUrl) customTags.push({ description: 'melovista_source_url', value: metadata.sourceUrl });
    if (metadata.lyricId) customTags.push({ description: 'melovista_lyric_id', value: metadata.lyricId });
    if (metadata.syncedLyrics) customTags.push({ description: 'melovista_lrc', value: metadata.syncedLyrics });

    if (customTags.length > 0) tags.userDefinedText = customTags;
  }

  private parseLRC(lrc: string): Array<{ text: string, timeStamp: number }> {

    const lines: Array<{ text: string, timeStamp: number }> = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    for (const line of lrc.split('\n')) {
      const match = line.match(regex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const msStr = match[3];
        const ms = parseInt(msStr.length === 2 ? msStr + '0' : msStr);
        const timeStamp = (minutes * 60 + seconds) * 1000 + ms;
        const text = match[4].trim();
        lines.push({ text, timeStamp });
      }
    }
    return lines;
  }
}
