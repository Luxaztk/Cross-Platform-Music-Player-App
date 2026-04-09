import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetadataManager } from '../MetadataManager';
import NodeID3 from 'node-id3';
import fs from 'node:fs/promises';

// 1. Mock module
vi.mock('node-id3');
vi.mock('node:fs/promises');

// 2. Lấy reference có kiểu dữ liệu chuẩn
const mockedFs = vi.mocked(fs);
const mockedNodeID3 = vi.mocked(NodeID3);

describe('MetadataManager', () => {
  let manager: MetadataManager;
  const mockPath = 'C:/music/test.mp3';

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new MetadataManager();
    // Stub global fetch an toàn
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should skip non-mp3 files', async () => {
    const result = await manager.writeMetadata('test.wav', { title: 'T' });
    expect(result).toBe(false);
  });

  it('should write basic tags to mp3 file', async () => {
    // FIX: access trả về Promise<void>, nên dùng undefined
    mockedFs.access.mockResolvedValue(undefined);
    mockedNodeID3.update.mockReturnValue(undefined);

    const metadata = { title: 'New Title' };
    await manager.writeMetadata(mockPath, metadata);

    expect(mockedNodeID3.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Title' }),
      mockPath
    );
  });

  it('should handle coverUrl', async () => {
    mockedFs.access.mockResolvedValue(undefined);
    mockedNodeID3.update.mockReturnValue(undefined);

    const mockBuffer = Buffer.from('image-data');
    const mockedFetch = vi.mocked(global.fetch);

    // FIX: Dùng unknown làm bước đệm để cast sang Response
    mockedFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBuffer.buffer),
    } as unknown as Response);

    await manager.writeMetadata(mockPath, { coverUrl: 'https://example.com/cover.jpg' });

    expect(mockedNodeID3.update).toHaveBeenCalled();
  });

  it('should handle coverPath', async () => {
    mockedFs.access.mockResolvedValue(undefined);
    mockedNodeID3.update.mockReturnValue(undefined);
    // FIX: readFile trả về Buffer
    mockedFs.readFile.mockResolvedValue(Buffer.from('local-image'));

    await manager.writeMetadata(mockPath, { coverPath: 'C:/images/cover.png' });

    expect(mockedNodeID3.update).toHaveBeenCalled();
  });

  it('should throw error if node-id3 update fails', async () => {
    mockedFs.access.mockResolvedValue(undefined);

    // FIX: NodeID3.update có thể trả về Error hoặc boolean
    // Chúng ta cast sang bất cứ thứ gì mà interface NodeID3.update cho phép
    mockedNodeID3.update.mockReturnValue(new Error('Write error') as any);

    await expect(manager.writeMetadata(mockPath, { title: 'T' }))
      .rejects.toThrow('Failed to update ID3 tags: Write error');
  });
});