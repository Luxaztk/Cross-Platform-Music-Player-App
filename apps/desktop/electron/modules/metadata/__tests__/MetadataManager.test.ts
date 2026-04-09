import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetadataManager } from '../MetadataManager';
import NodeID3 from 'node-id3';
import fs from 'node:fs/promises';

vi.mock('node-id3');
vi.mock('node:fs/promises');
vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual as any,
    constants: { 
        W_OK: 2,
        R_OK: 4
    }
  };
});

// Mock global fetch for coverUrl tests
global.fetch = vi.fn();

describe('MetadataManager', () => {
  let manager: MetadataManager;
  const mockPath = 'C:/music/test.mp3';

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MetadataManager();
  });

  it('should skip non-mp3 files', async () => {
    const result = await manager.writeMetadata('test.wav', { title: 'T' });
    expect(result).toBe(false);
  });

  it('should write basic tags to mp3 file', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(true);

    const metadata = {
      title: 'New Title',
      artist: 'New Artist',
      album: 'New Album'
    };

    await manager.writeMetadata(mockPath, metadata);

    expect(NodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Title',
        artist: 'New Artist',
        album: 'New Album'
      }),
      mockPath
    );
  });

  it('should handle unsynchronised lyrics', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(true);

    await manager.writeMetadata(mockPath, { lyrics: 'Line 1\nLine 2' });

    expect(NodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({
        unsynchronisedLyrics: {
          language: 'eng',
          text: 'Line 1\nLine 2'
        }
      }),
      mockPath
    );
  });

  it('should handle coverUrl', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(true);
    
    const mockBuffer = Buffer.from('image-data');
    (global.fetch as any).mockResolvedValue({
      arrayBuffer: () => Promise.resolve(mockBuffer)
    });

    await manager.writeMetadata(mockPath, { coverUrl: 'https://example.com/cover.jpg' });

    expect(NodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({
        image: expect.objectContaining({
          mime: 'image/jpeg'
        })
      }),
      mockPath
    );
  });

  it('should handle coverPath', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(true);
    (fs.readFile as any).mockResolvedValue(Buffer.from('local-image'));

    await manager.writeMetadata(mockPath, { coverPath: 'C:/images/cover.png' });

    expect(NodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({
        image: expect.objectContaining({
          mime: 'image/png'
        })
      }),
      mockPath
    );
  });

  it('should handle coverData (base64)', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(true);

    const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    await manager.writeMetadata(mockPath, { coverData: base64Data });

    expect(NodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({
        image: expect.objectContaining({
          mime: 'image/png'
        })
      }),
      mockPath
    );
  });

  it('should embed Melovista tracking tags', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(true);

    await manager.writeMetadata(mockPath, { 
      originId: 'yt-123', 
      sourceUrl: 'https://youtube.com/v123' 
    });

    expect(NodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({
        userDefinedText: expect.arrayContaining([
          { description: 'melovista_origin_id', value: 'yt-123' },
          { description: 'melovista_source_url', value: 'https://youtube.com/v123' }
        ])
      }),
      mockPath
    );
  });

  it('should throw error if node-id3 update fails', async () => {
    (fs.access as any).mockResolvedValue(undefined);
    (NodeID3.update as any).mockReturnValue(new Error('Write error'));

    await expect(manager.writeMetadata(mockPath, { title: 'T' }))
      .rejects.toThrow('Failed to update ID3 tags: Write error');
  });
});
