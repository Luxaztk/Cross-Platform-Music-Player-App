import NodeID3 from 'node-id3';
import fs from 'node:fs/promises';
import { constants } from 'node:fs'; // Import constants chuẩn
import { logFileTrace } from '../../infrastructure/FileTraceLogger';

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
      logFileTrace('MetadataManager.writeMetadata', filePath, 'SUCCESS', 'Starting metadata write');
      if (!filePath.toLowerCase().endsWith('.mp3')) {
        logFileTrace('MetadataManager.writeMetadata', filePath, 'FAIL', 'Unsupported extension');
        return false;
      }

      // Dùng constants đã import
      await fs.access(filePath, constants.W_OK);
      logFileTrace('MetadataManager.writeMetadata.access', filePath, 'SUCCESS', 'File is writable');

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

      logFileTrace('MetadataManager.writeMetadata', filePath, 'SUCCESS', 'Metadata written successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logFileTrace('MetadataManager.writeMetadata', filePath, 'FAIL', `[Metadata Error]: ${message}`);
      console.error('[Metadata Error]: writeMetadata fatal error:', error);
      throw error;
    }
  }

  /**
   * Helper: Giải quyết nguồn ảnh và trả về Buffer
   */
  private async resolveImageBuffer(metadata: ID3Metadata): Promise<Buffer | null> {
    try {
      if (metadata.coverUrl) {
        logFileTrace('MetadataManager.resolveImageBuffer.coverUrl', metadata.coverUrl, 'SUCCESS', 'Fetching remote cover image');
        const response = await fetch(metadata.coverUrl);
        if (!response.ok) {
          logFileTrace('MetadataManager.resolveImageBuffer.coverUrl', metadata.coverUrl, 'FAIL', `[Metadata Error]: Fetch status ${response.status}`);
          return null;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        
        if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') {
           console.warn('[Metadata Error]: Remote thumbnail is WebP. Conversion to JPEG is required for MP3 tags.');
           logFileTrace('MetadataManager.resolveImageBuffer', metadata.coverUrl, 'FAIL', '[Metadata Error]: WebP format detected from URL');
        }
        
        logFileTrace('MetadataManager.resolveImageBuffer.coverUrl', metadata.coverUrl, buffer.length === 0 ? 'EMPTY_BUFFER' : 'SUCCESS', `Fetched ${buffer.length} bytes`);
        return buffer;
      }

      if (metadata.coverPath) {
        logFileTrace('MetadataManager.resolveImageBuffer.coverPath', metadata.coverPath, 'SUCCESS', 'Reading local cover image');
        const buffer = await fs.readFile(metadata.coverPath);
        
        if (buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP') {
           console.warn('[Metadata Error]: Local cover file is WebP. Conversion to JPEG is required for MP3 tags.');
           logFileTrace('MetadataManager.resolveImageBuffer', metadata.coverPath, 'FAIL', '[Metadata Error]: WebP format detected from file path');
        }
        
        logFileTrace('MetadataManager.resolveImageBuffer.coverPath', metadata.coverPath, buffer.length === 0 ? 'EMPTY_BUFFER' : 'SUCCESS', `Read ${buffer.length} bytes`);
        return buffer;
      }

      if (metadata.coverData?.startsWith('data:image')) {
        const base64Data = metadata.coverData.split(';base64,').pop();
        const buffer = base64Data ? Buffer.from(base64Data, 'base64') : null;
        logFileTrace('MetadataManager.resolveImageBuffer.coverData', undefined, buffer && buffer.length > 0 ? 'SUCCESS' : 'EMPTY_BUFFER', 'Decoded base64 image data');
        
        if (buffer && buffer.length > 12) {
          const signature = buffer.toString('ascii', 8, 12);
          if (signature === 'WEBP') {
             console.warn('[Metadata Error]: Detected WebP cover data. Standard MP3 tags require JPEG/PNG.');
             logFileTrace('MetadataManager.resolveImageBuffer', 'webp-detected', 'FAIL', '[Metadata Error]: WebP format is not compatible with standard ID3 tags');
          }
        }
        
        return buffer;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logFileTrace('MetadataManager.resolveImageBuffer', metadata.coverPath || metadata.coverUrl, 'FAIL', `[Metadata Error]: ${message}`);
      console.error('[Metadata Error]: resolveImageBuffer failed:', error);
      return null;
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
