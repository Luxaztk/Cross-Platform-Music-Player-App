import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importPickedAudioAssets } from '../../../infrastructure/repositories/importAudio';

// Mock expo-file-system
vi.mock('expo-file-system', () => {
  return {
    Paths: { document: 'mock-document-path' },
    Directory: vi.fn().mockImplementation(function (this: any, parent: any, name: string) {
      this.uri = typeof parent === 'object' ? `${parent.uri}/${name}` : `${parent}/${name}`;
      this.exists = true;
      this.create = vi.fn();
    }),
    File: vi.fn().mockImplementation(function (this: any, pathOrDir: any, name?: string) {
      if (typeof pathOrDir === 'object' && name) {
        this.uri = `${pathOrDir.uri}/${name}`;
      } else {
        this.uri = pathOrDir;
      }
      this.exists = true;
      this.size = 1024;
      this.bytes = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
      this.write = vi.fn();
    })
  };
});

// Mock expo-audio
vi.mock('expo-audio', () => ({
  createAudioPlayer: vi.fn().mockImplementation(() => ({
    duration: 120000,
    remove: vi.fn(),
  })),
}));

describe('importAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports audio assets correctly', async () => {
    const assets = [
      { uri: 'file://original/song.mp3', name: 'song.mp3' }
    ];

    const { songs, skippedDuplicates } = await importPickedAudioAssets(assets);

    expect(skippedDuplicates).toBe(0);
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('song');
    expect(songs[0].duration).toBe(120000);
    expect(songs[0].sourceUrl).toBe('file://original/song.mp3');
    expect(songs[0].fileSize).toBe(1024);
  });

  it('skips duplicate source URIs if provided in options', async () => {
    const assets = [
      { uri: 'file://original/song1.mp3', name: 'song1.mp3' },
      { uri: 'file://original/song2.mp3', name: 'song2.mp3' },
    ];
    const existingSourceUris = new Set(['file://original/song1.mp3']);

    const { songs, skippedDuplicates } = await importPickedAudioAssets(assets, { existingSourceUris });

    expect(skippedDuplicates).toBe(1);
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('song2');
  });

  it('skips duplicate URIs within the same import batch', async () => {
    const assets = [
      { uri: 'file://original/song.mp3', name: 'song.mp3' },
      { uri: 'file://original/song.mp3', name: 'song.mp3' },
    ];

    const { songs, skippedDuplicates } = await importPickedAudioAssets(assets);

    // It should import the first one, and skip the second one without incrementing skippedDuplicates
    // because skippedDuplicates only counts against existingSourceUris
    expect(skippedDuplicates).toBe(0);
    expect(songs).toHaveLength(1);
  });
});
