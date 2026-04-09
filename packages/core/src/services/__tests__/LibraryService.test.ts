import { describe, it, expect, beforeEach } from 'vitest';
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
}

describe('LibraryService', () => {
  let adapter: MockStorageAdapter;
  let service: LibraryService;

  beforeEach(() => {
    adapter = new MockStorageAdapter();
    service = new LibraryService(adapter);
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
      expect(adapter.songs['1']).toEqual(mockSong);
      expect(adapter.library.songIds).toContain('1');
    });

    it('should detect duplicate by File Path (Priority: PATH)', async () => {
      await service.processAndAddSongs([mockSong]);

      const duplicateSong = { ...mockSong, id: '2' };
      const result = await service.processAndAddSongs([duplicateSong]);

      expect(result.addedCount).toBe(0);
      expect(result.duplicateSongs[0].duplicateReason).toBe('PATH');
    });

    it('should detect duplicate by Source URL (Priority: URL)', async () => {
      const songWithUrl: Song = { ...mockSong, sourceUrl: 'https://youtube.com/watch?v=123' };
      await service.processAndAddSongs([songWithUrl]);

      const duplicateSong: Song = {
        ...mockSong,
        id: '2',
        filePath: 'C:/other/path.mp3',
        sourceUrl: 'https://youtube.com/watch?v=123'
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
        duration: 250 // Different duration but should still match
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

      // Case 3: Borderline Fail (75% similarity but duration >= 0.5s)
      const borderlineFail: Song = {
        ...mockSong,
        id: 'not-dup',
        title: 'Not a Dup (Hash)', // Change metadata to avoid METADATA match
        filePath: 'C:/music/new.mp3',
        hash: smartMatchHash,
        duration: 201.0 // Diff = 1.0s
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

      const playlist = await service.createPlaylist('P1');
      await service.addSongsToPlaylist(playlist.id, ['s1']);

      await service.deleteSong('s1');

      expect(adapter.songs['s1']).toBeUndefined();
      expect(adapter.library.songIds).not.toContain('s1');

      const updatedPlaylist = await service.getPlaylistById(playlist.id);
      expect(updatedPlaylist?.songIds).not.toContain('s1');
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
