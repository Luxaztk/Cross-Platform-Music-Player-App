import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LibraryService } from '../LibraryService';
import type { IStorageAdapter } from '../../interfaces/IStorageAdapter';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';

// Mock Storage Adapter for In-Memory testing
class MockStorageAdapter implements IStorageAdapter {
  public songs: Record<string, Song> = {};
  public library: Playlist = { id: '0', name: 'Library', songIds: [], createdAt: '', description: '' };
  public playlists: Record<string, Playlist> = {};

  async getSongs() { return { ...this.songs }; }
  async getLibrary() { return { ...this.library }; }
  async getPlaylists() { return { '0': this.library, ...this.playlists }; }

  async saveSongs(songs: Record<string, Song>) { this.songs = { ...songs }; }
  async saveLibrary(library: Playlist) { this.library = { ...library }; }
  async savePlaylists(playlists: Record<string, Playlist>) {
    this.playlists = { ...playlists };
    delete this.playlists['0'];
  }

  async getPlayerState(): Promise<PlayerState | null> { return null; }
  async savePlayerState() { }
  async getRecentSearches(): Promise<RecentSearch[]> { return []; }
  async saveRecentSearches() { }

  async getLyricUsage(): Promise<Record<string, number>> {
    return {}; // Trả về object rỗng vì test này không dùng đến lyrics
  }

  async saveLyricUsage(_usage: Record<string, number>): Promise<void> {
    // Không làm gì cả
  }

  async clear(): Promise<void> {
    this.songs = {};
    this.library = { id: '0', name: 'Library', songIds: [], createdAt: '', description: '' };
    this.playlists = {};
  }
}

class MockMetadataService {
  async extract(filePath: string, sourceUrl?: string, originId?: string): Promise<Song | null> {
    // Trả về một song tối thiểu cho mục đích test
    return {
      id: 'mock-id',
      filePath,
      sourceUrl,
      originId,
      title: 'Mock Title',
      artist: 'Mock Artist',
      duration: 180,
      hash: 'p2:mockhash',
      album: '',
      genre: '',
      fileSize: 1024,
      artists: ['Mock Artist'],
      year: 2024,
      coverArt: null
    };
  }
}

describe('LibraryService', () => {
  let adapter: MockStorageAdapter;
  let metadataService: MockMetadataService;
  let service: LibraryService;

  beforeEach(() => {
    adapter = new MockStorageAdapter();
    metadataService = new MockMetadataService();
    service = new LibraryService(adapter, metadataService as any);

    // Mock ID generation for deterministic testing
    let idCounter = 0;
    const mockIds = ['1', '2', 'dup1', 'dup2', 'not-dup', 'd1', 'new', 'vi1', 'vi2', 'e1', 'e2', 'orig', 'new-id-from-scan', 'w1', 'w2', 's1', 'Favorites', 'To Delete', 'Playlist 1', 'P1'];
    
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockImplementation(() => {
        return mockIds[idCounter++] || `generated-id-${idCounter}`;
      })
    });

    // Also mock Math.random fallback just in case
    vi.spyOn(Math, 'random').mockImplementation(() => 0.1);
  });

  describe('processAndAddSongs (Duplicate Detection)', () => {
    const mockSong: Song = {
      id: '1',
      title: 'Song 1',
      artist: 'Artist 1',
      filePath: 'C:/music/song1.mp3',
      duration: 180,
      hash: 'p2:abcdefg',
      album: 'Album 1',
      genre: 'Pop',
      fileSize: 1024,
      artists: ['Artist 1'],
      year: 2024,
      coverArt: null
    };

    it('should add a new song if no duplicates exist', async () => {
      const result = await service.processAndAddSongs([mockSong]);

      expect(result.addedCount).toBe(1);
      expect(result.duplicatePaths).toHaveLength(0);
      
      const addedSong = Object.values(adapter.songs)[0];
      expect(addedSong).toMatchObject({
        ...mockSong,
        id: expect.any(String),
        createdAt: expect.any(String)
      });
      expect(adapter.library.songIds).toContain(addedSong.id);
    });

    it('should implement Self-Match Guard for same File Path (Success/Update instead of Duplicate)', async () => {
      await service.processAndAddSongs([mockSong]);
      const initialId = Object.values(adapter.songs)[0].id;

      const duplicateSong = { ...mockSong, id: 'some-other-id', title: 'Updated Title' };
      const result = await service.processAndAddSongs([duplicateSong]);

      expect(result.addedCount).toBe(1); // Now counts as success because it UPDATED
      expect(result.duplicateSongs).toHaveLength(0);
      expect(adapter.songs[initialId].title).toBe('Updated Title');
    });

    it('should detect duplicate by Source URL (Priority: URL)', async () => {
      const validUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      const songWithUrl: Song = { ...mockSong, sourceUrl: validUrl };
      await service.processAndAddSongs([songWithUrl]);

      const duplicateSong: Song = {
        ...mockSong,
        id: '2',
        filePath: 'C:/other/path.mp3',
        sourceUrl: validUrl
      };
      const result = await service.processAndAddSongs([duplicateSong]);

      expect(result.addedCount).toBe(0);
      expect(result.duplicateSongs[0].duplicateReason).toBe('URL');
    });

    it('should detect duplicate by Perceptual Hash - Tiered Logic', async () => {
      // Base song with 64-char hash (p2: prefix)
      const baseHash = 'p2:' + 'a'.repeat(64);
      const songWithHash: Song = { ...mockSong, hash: baseHash, duration: 200 };
      await service.processAndAddSongs([songWithHash]);

      // Case 1: Strict Match (>= 95% similarity, duration ignored)
      // 95% of 64 is 60.8. Let's change 3 chars (95.3%)
      const strictMatchHash = 'p2:' + 'a'.repeat(61) + 'bbb';
      const duplicate1: Song = {
        ...mockSong,
        id: 'dup1',
        filePath: 'C:/music/dup1.mp3',
        hash: strictMatchHash,
        duration: 202 // 202s is within 2% of 200s (4s tolerance)
      };

      const res1 = await service.processAndAddSongs([duplicate1]);
      expect(res1.addedCount).toBe(0);
      expect(res1.duplicateSongs[0].duplicateReason).toBe('HASH');

      // Case 2: Smart Match (>= 75% similarity + duration < 0.5s)
      // 75% of 64 is 48 chars. Let's change 10 chars (84.3%)
      const smartMatchHash = 'p2:' + 'a'.repeat(50) + 'b'.repeat(14);
      const duplicate2: Song = {
        ...mockSong,
        id: 'dup2',
        filePath: 'C:/music/dup2.mp3',
        hash: smartMatchHash,
        duration: 200.4 // Diff < 0.5s
      };

      const res2 = await service.processAndAddSongs([duplicate2]);
      expect(res2.addedCount).toBe(0);

      // Case 3: Borderline Fail (75% similarity but duration >= 2% and >= 15s)
      const borderlineFail: Song = {
        ...mockSong,
        id: 'not-dup',
        title: 'Not a Dup (Hash)', // Change metadata to avoid METADATA match
        filePath: 'C:/music/new.mp3',
        hash: smartMatchHash,
        duration: 220.0 // Diff = 20.0s, which is > 15s max tolerance and > 4s (2%)
      };

      const res3 = await service.processAndAddSongs([borderlineFail]);
      expect(res3.addedCount).toBe(1);
    });

    it('should detect duplicate by binary hash (p1: prefix)', async () => {
      const song1: Song = { ...mockSong, hash: 'p1:binaryhash' };
      await service.processAndAddSongs([song1]);

      const duplicate: Song = { ...mockSong, id: 'd1', filePath: 'C:/other.mp3', hash: 'p1:binaryhash' };
      const res = await service.processAndAddSongs([duplicate]);
      expect(res.addedCount).toBe(0);
      expect(res.duplicateSongs[0].duplicateReason).toBe('HASH');
    });

    it('should NOT detect as duplicate if hash is present but has different prefix or invalid format', async () => {
      await service.processAndAddSongs([mockSong]);
      const diffSong = {
        ...mockSong,
        id: 'new',
        title: 'Not a Dup (Format)', // Change metadata
        filePath: 'C:/new.mp3',
        hash: 'random-hash'
      };
      const res = await service.processAndAddSongs([diffSong]);
      expect(res.addedCount).toBe(1);
    });

    it('should detect duplicate by Title + Artist (Priority: METADATA)', async () => {
      await service.processAndAddSongs([mockSong]);

      const duplicateSong: Song = {
        ...mockSong,
        id: '2',
        filePath: 'C:/other/path.mp3',
        hash: 'p2:completely-different-hash-at-the-end-of-the-string-to-be-sure'
      };

      const result = await service.processAndAddSongs([duplicateSong]);

      expect(result.addedCount).toBe(0);
      expect(result.duplicateSongs[0].duplicateReason).toBe('METADATA');
    });

    it('[REGRESSION] should match Vietnamese titles with different accents/normalization (Vietnamese Support)', async () => {
      // Use unique hash and duration to avoid HASH match
      const songVi: Song = { ...mockSong, title: 'Tiếng Việt', artist: 'Ca Sĩ', hash: 'p2:vietnamese-base-hash', duration: 123 };
      await service.processAndAddSongs([songVi]);

      const duplicateVi: Song = {
        ...mockSong,
        id: 'vi2',
        filePath: 'C:/music/tiengviet_copy.mp3',
        title: 'tieng viet', // Normalized version
        artist: 'ca si',
        hash: 'p2:different-perceptual-hash', // Unique hash to force METADATA match
        duration: 123
      };
      const result = await service.processAndAddSongs([duplicateVi]);

      expect(result.addedCount).toBe(0);
      expect(result.duplicateSongs[0].duplicateReason).toBe('METADATA');
    });

    it('[REGRESSION] should NOT collide when both songs have empty Title and Artist (Empty Metadata Guard)', async () => {
      // Use unique hashes to avoid HASH match
      const emptySong1: Song = { ...mockSong, id: 'e1', title: '', artist: '', filePath: 'C:/path1.mp3', hash: 'p2:empty1', duration: 100 };
      await service.processAndAddSongs([emptySong1]);

      const emptySong2: Song = { ...mockSong, id: 'e2', title: '  ', artist: '', filePath: 'C:/path2.mp3', hash: 'p2:empty2', duration: 200 };
      const result = await service.processAndAddSongs([emptySong2]);

      expect(result.addedCount).toBe(1);
      expect(result.duplicateSongs).toHaveLength(0);
    });

    it('[REGRESSION] should implement Self-Match Guard: Update metadata instead of deleting same-path file', async () => {
      await service.processAndAddSongs([mockSong]);
      const initialId = Object.values(adapter.songs)[0].id;

      // Second pass with updated metadata (e.g. after FFmpeg post-processing)
      const updatedPass: Song = {
        ...mockSong,
        filePath: mockSong.filePath, // Critical: Same path
        title: 'Updated Title',
        coverArt: 'base64-data'
      };

      const result = await service.processAndAddSongs([updatedPass]);

      expect(result.addedCount).toBe(1); // Treated as a successful "added" (actually updated)
      expect(result.duplicateSongs).toHaveLength(0); // CRITICAL: No duplicate reason = No unlinking

      // Verify the record was updated while keeping the original ID
      const saved = adapter.songs[initialId];
      expect(saved.title).toBe('Updated Title');
      expect(saved.coverArt).toBe('base64-data');
    });

    it('[REGRESSION] should handle Windows path casing/slashes correctly (isSamePath Guard)', async () => {
      const songWin: Song = { ...mockSong, filePath: 'C:\\Music\\Song.mp3' };
      await service.processAndAddSongs([songWin]);
      const initialId = Object.values(adapter.songs)[0].id;

      const sameSongDiffPath: Song = { ...mockSong, filePath: 'c:/music/song.mp3' };
      const result = await service.processAndAddSongs([sameSongDiffPath]);

      expect(result.addedCount).toBe(1);
      expect(result.duplicateSongs).toHaveLength(0);
      expect(adapter.songs[initialId].id).toBe(initialId); // Verified it updated instead of duplicate
    });

    it('should detect duplicate with dynamic tolerance for long mixtapes (10m vs 10m 10s)', async () => {
      const baseHash = 'p2:' + 'a'.repeat(64);
      const mixtape: Song = { 
        ...mockSong, 
        id: 'mix1', 
        filePath: 'C:/music/mix1.mp3',
        duration: 600, // 10 minutes
        hash: baseHash 
      };
      await service.processAndAddSongs([mixtape]);

      const duplicateMixtape: Song = {
        ...mockSong,
        id: 'mix2',
        title: 'Different Title', // Change to force hash check
        filePath: 'C:/music/mix2.mp3',
        duration: 625, // 25s difference, now within 30s tolerance (5% of 600)
        hash: baseHash
      };

      const result = await service.processAndAddSongs([duplicateMixtape]);
      expect(result.addedCount).toBe(0);
      expect(result.duplicateSongs[0].duplicateReason).toBe('HASH');
    });

    it('should respect the 60s cap for extremely long mixtapes', async () => {
      const baseHash = 'p2:' + 'a'.repeat(64);
      const longMix: Song = { 
        ...mockSong, 
        id: 'mix3', 
        filePath: 'C:/music/mix3.mp3',
        duration: 2000, // 33.3 minutes
        hash: baseHash 
      };
      await service.processAndAddSongs([longMix]);

      // 5% of 2000 is 100s, but cap is 60s.
      // So 2059s should be duplicate, 2061s should NOT.
      
      const duplicateMix: Song = {
        ...mockSong,
        id: 'mix4',
        filePath: 'C:/music/mix4.mp3',
        duration: 2059, // 59s diff
        hash: baseHash
      };
      const res1 = await service.processAndAddSongs([duplicateMix]);
      expect(res1.addedCount).toBe(0);

      const uniqueMix: Song = {
        ...mockSong,
        id: 'mix5',
        title: 'Unique Metadata',
        filePath: 'C:/music/mix5.mp3',
        duration: 2065, // 65s diff (> 60s)
        hash: baseHash
      };
      const res2 = await service.processAndAddSongs([uniqueMix]);
      expect(res2.addedCount).toBe(1);
    });

    it('should detect duplicate with normalized YouTube URLs (Clean vs Dirty)', async () => {
      const cleanUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const dirtyUrl = 'https://youtu.be/dQw4w9WgXcQ?si=abcdef&t=5';

      const original: Song = { 
        ...mockSong, 
        id: 'yt1', 
        filePath: 'C:/music/yt1.mp3',
        sourceUrl: cleanUrl 
      };
      await service.processAndAddSongs([original]);

      const duplicate: Song = {
        ...mockSong,
        id: 'yt2',
        filePath: 'C:/music/yt2.mp3',
        sourceUrl: dirtyUrl
      };

      const result = await service.processAndAddSongs([duplicate]);
      expect(result.addedCount).toBe(0);
      expect(result.duplicateSongs[0].duplicateReason).toBe('URL');
    });

    it('should scrub URLs at the earliest entry point (importFromPath)', async () => {
      const dirtyUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=trackingparams';
      const cleanUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      const spy = vi.spyOn(metadataService, 'extract');
      
      await service.importFromPath('C:/music/test.mp3', 'TEST', dirtyUrl);
      
      // Verify extract was called with cleaned URL
      expect(spy).toHaveBeenCalledWith(expect.any(String), cleanUrl, undefined);
      
      // Verify URL saved in adapter is also clean
      const addedSong = Object.values(adapter.songs)[0];
      expect(addedSong.sourceUrl).toBe(cleanUrl);
    });
  });

  describe('Playlist Management', () => {
    it('should create a new playlist', async () => {
      const playlist = await service.createPlaylist('Favorites');

      expect(playlist.name).toBe('Favorites');
      expect(adapter.playlists[playlist.id]).toBeDefined();
    });

    it('should not allow deleting the Library playlist (ID: 0)', async () => {
      const result = await service.deletePlaylist('0');
      expect(result).toBe(false);
    });

    it('should delete a custom playlist', async () => {
      const playlist = await service.createPlaylist('To Delete');
      const result = await service.deletePlaylist(playlist.id);

      expect(result).toBe(true);
      expect(adapter.playlists[playlist.id]).toBeUndefined();
    });

    it('should add/remove songs to/from playlist', async () => {
      const playlist = await service.createPlaylist('Playlist 1');
      const songId = 'song-123';

      // Add
      await service.addSongsToPlaylist(playlist.id, [songId]);
      let updated = await service.getPlaylistById(playlist.id);
      expect(updated?.songIds).toContain(songId);

      // Remove
      await service.removeSongsFromPlaylist(playlist.id, [songId]);
      updated = await service.getPlaylistById(playlist.id);
      expect(updated?.songIds).not.toContain(songId);
    });
  });

  describe('Song Management', () => {
    it('should delete a song and remove it from all playlists', async () => {
      const song: Song = { id: 's1', title: 'T', artist: 'A', filePath: 'P', duration: 1, hash: 'H', album: '', genre: '', fileSize: 0, artists: ['A'], year: null, coverArt: null };
      await service.processAndAddSongs([song]);
      const addedId = Object.values(adapter.songs)[0].id;

      const playlist = await service.createPlaylist('P1');
      await service.addSongsToPlaylist(playlist.id, [addedId]);

      await service.deleteSong(addedId);

      expect(adapter.songs[addedId]).toBeUndefined();
      expect(adapter.library.songIds).not.toContain(addedId);

      const updatedPlaylist = await service.getPlaylistById(playlist.id);
      expect(updatedPlaylist?.songIds).not.toContain(addedId);
    });

    it('should update song information', async () => {
      const song: Song = { id: 's1', title: 'Old Title', artist: 'A', filePath: 'P', duration: 1, hash: 'H', album: '', genre: '', fileSize: 0, artists: ['A'], year: null, coverArt: null };
      await service.processAndAddSongs([song]);

      const updatedSong = { ...song, title: 'New Title' };
      await service.updateSong(updatedSong);

      expect(adapter.songs['s1'].title).toBe('New Title');
    });
  });
});
