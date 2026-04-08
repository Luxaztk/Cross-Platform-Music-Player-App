import NodeID3 from 'node-id3';
import fs from 'node:fs/promises';

export interface ID3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  lyrics?: string;
  syncedLyrics?: string; // LRC string or parsed SYLT format
  coverPath?: string; 
  coverUrl?: string; 
  coverData?: string; 
  originId?: string;
  sourceUrl?: string;
  lyricId?: string;
}

export class MetadataManager {
  /**
   * Writes ID3 tags to an MP3 file
   */
  public async writeMetadata(filePath: string, metadata: ID3Metadata): Promise<boolean> {
    try {
      // Only support MP3 for now (NodeID3 limitation)
      if (!filePath.toLowerCase().endsWith('.mp3')) {
        console.warn(`[MetadataManager] Skipping non-MP3 file: ${filePath}`);
        return false;
      }

      await fs.access(filePath, require('node:fs').constants.W_OK);

      const tags: NodeID3.Tags = {};

      if (metadata.title) tags.title = metadata.title;
      if (metadata.artist) tags.artist = metadata.artist;
      if (metadata.album) tags.album = metadata.album;
      
      if (metadata.lyrics) {
        tags.unsynchronisedLyrics = {
          language: 'eng',
          text: metadata.lyrics
        };
      } else if (metadata.syncedLyrics && !metadata.lyrics) {
        // Fallback: Create plain text lyrics from synced lyrics by stripping timestamps
        const plainText = metadata.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
        tags.unsynchronisedLyrics = {
          language: 'eng',
          text: plainText
        };
      }
      
      if (metadata.syncedLyrics) {
        const lines = this.parseLRC(metadata.syncedLyrics);
        if (lines.length > 0) {
          tags.synchronisedLyrics = [{
            language: 'eng',
            timeStampFormat: 2, // milliseconds
            contentType: 1, // lyrics
            shortText: 'Lyrics',
            synchronisedText: lines
          }];
        }
      }

      // Handle Image (Priority: URL > Path > Data)
      if (metadata.coverUrl) {
        try {
          const response = await fetch(metadata.coverUrl);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          
          tags.image = {
            mime: metadata.coverUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            description: 'Front Cover',
            imageBuffer: imageBuffer
          };
        } catch (e) {
          console.error('Failed to fetch coverUrl:', e);
        }
      } else if (metadata.coverPath) {
        try {
          const imageBuffer = await fs.readFile(metadata.coverPath);
          tags.image = {
            mime: metadata.coverPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            description: 'Front Cover',
            imageBuffer: imageBuffer
          };
        } catch (e) {
          console.error('Failed to read coverPath:', e);
        }
      } else if (metadata.coverData && metadata.coverData.startsWith('data:image')) {
        try {
          const base64Data = metadata.coverData.split(';base64,').pop();
          if (base64Data) {
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const mimeMatch = metadata.coverData.match(/data:(image\/[a-zA-Z]+);base64/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';

            tags.image = {
              mime: mime,
              type: { id: 3, name: 'front cover' },
              description: 'Front Cover',
              imageBuffer: imageBuffer
            };
          }
        } catch (e) {
          console.error('Failed to parse coverData (base64):', e);
        }
      }

      // Embed Melovista tracking metadata
      tags.userDefinedText = [];
      if (metadata.originId) {
        tags.userDefinedText.push({ description: 'melovista_origin_id', value: metadata.originId });
      }
      if (metadata.sourceUrl) {
        tags.userDefinedText.push({ description: 'melovista_source_url', value: metadata.sourceUrl });
      }
      if (metadata.lyricId) {
        tags.userDefinedText.push({ description: 'melovista_lyric_id', value: metadata.lyricId });
      }
      if (metadata.syncedLyrics) {
        tags.userDefinedText.push({ description: 'melovista_lrc', value: metadata.syncedLyrics });
      }
      if (tags.userDefinedText.length === 0) {
        delete tags.userDefinedText;
      }

      console.log(`[MetadataManager] Writing tags to: ${filePath}`);
      console.log(`[MetadataManager] Tags keys: ${Object.keys(tags).join(', ')}`);
      if (tags.unsynchronisedLyrics) console.log(`[MetadataManager] Writing USLT (plain lyrics)...`);
      if (tags.synchronisedLyrics) console.log(`[MetadataManager] Writing SYLT (synced lyrics)...`);

      // Merge tags (update existing, don't just overwrite all)
      const success = NodeID3.update(tags, filePath);
      
      if (success instanceof Error) {
        console.error(`[MetadataManager] NodeID3 Error:`, success);
        throw new Error(`Failed to update ID3 tags: ${success.message}`);
      }
      
      if (success === true) {
        console.log(`[MetadataManager] Successfully updated metadata for: ${filePath}`);
      } else {
        console.warn(`[MetadataManager] NodeID3.update returned non-true value:`, success);
      }

      return true;
    } catch (error) {
      console.error('[MetadataManager] writeMetadata fatal error:', error);
      throw error;
    }
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
