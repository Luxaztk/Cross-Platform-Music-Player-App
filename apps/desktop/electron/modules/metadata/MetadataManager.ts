import NodeID3 from 'node-id3';
import fs from 'node:fs/promises';

export interface ID3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  lyrics?: string;
  coverPath?: string; // Local path to image
  coverUrl?: string; // Remote URL to image
  coverData?: string; // Base64 Data URI
  originId?: string;
  sourceUrl?: string;
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
          language: 'vie',
          text: metadata.lyrics
        };
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
      if (tags.userDefinedText.length === 0) {
        delete tags.userDefinedText;
      }

      // Merge tags (update existing, don't just overwrite all)
      const success = NodeID3.update(tags, filePath);
      if (success instanceof Error) {
         throw new Error(`Failed to update ID3 tags: ${success.message}`);
      }
      return true;
    } catch (error) {
      console.error('MetadataManager error:', error);
      throw error;
    }
  }
}
