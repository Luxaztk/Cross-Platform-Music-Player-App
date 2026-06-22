import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectronLibraryRepository } from '../../../infrastructure/repositories/ElectronLibraryRepository';
import type { Song, Playlist } from '@music/types';

describe('ElectronLibraryRepository', () => {
  let repository: ElectronLibraryRepository;

  beforeEach(() => {
    repository = new ElectronLibraryRepository();
    
    // Mock window.electronAPI
    (window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI = {
      getLibrary: vi.fn(),
      getPlaylists: vi.fn(),
      createPlaylist: vi.fn(),
      updatePlaylist: vi.fn(),
      updateSong: vi.fn(),
      deleteSong: vi.fn(),
      deleteSongs: vi.fn(),
      removeSongsFromPlaylist: vi.fn(),
      addSongsToPlaylist: vi.fn(),
      deletePlaylist: vi.fn(),
      importFiles: vi.fn(),
      importFolder: vi.fn(),
      addSongs: vi.fn(),
      scanMissingFiles: vi.fn(),
      runAutoImportScan: vi.fn(),
      getLyrics: vi.fn(),
      saveLyrics: vi.fn(),
      searchLyrics: vi.fn(),
      patchSong: vi.fn(),
      getSettings: vi.fn(),
      getSyncHistory: vi.fn(),
      clearSyncHistory: vi.fn(),
      logSyncEvent: vi.fn(),
    };
  });

  it('getLibrary calls getLibrary', async () => {
    const mockData = { songs: [], library: { id: 'lib1' } as Playlist };
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibrary).mockResolvedValue(mockData);
    
    const result = await repository.getLibrary();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibrary).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it('getPlaylists calls getPlaylists', async () => {
    const mockPlaylists = [{ id: 'p1' }] as Playlist[];
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylists).mockResolvedValue(mockPlaylists);
    
    const result = await repository.getPlaylists();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylists).toHaveBeenCalled();
    expect(result).toEqual(mockPlaylists);
  });

  it('createPlaylist calls createPlaylist', async () => {
    const mockPlaylist = { id: 'p1', title: 'New' } as unknown as Playlist;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.createPlaylist).mockResolvedValue(mockPlaylist);
    
    const result = await repository.createPlaylist('New');
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.createPlaylist).toHaveBeenCalledWith('New');
    expect(result).toEqual(mockPlaylist);
  });

  it('updatePlaylist calls updatePlaylist', async () => {
    const mockPlaylist = { id: 'p1', title: 'Updated' } as unknown as Playlist;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.updatePlaylist).mockResolvedValue(mockPlaylist);
    
    const result = await repository.updatePlaylist(mockPlaylist);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.updatePlaylist).toHaveBeenCalledWith(mockPlaylist);
    expect(result).toEqual(mockPlaylist);
  });

  it('updateSong calls updateSong', async () => {
    const mockSong = { id: 's1', title: 'Updated' } as Song;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.updateSong).mockResolvedValue(mockSong);
    
    const result = await repository.updateSong(mockSong);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.updateSong).toHaveBeenCalledWith(mockSong);
    expect(result).toEqual(mockSong);
  });

  it('deleteSong calls deleteSong', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.deleteSong).mockResolvedValue(true);
    const result = await repository.deleteSong('s1');
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.deleteSong).toHaveBeenCalledWith('s1');
    expect(result).toBe(true);
  });

  it('deleteSongs calls deleteSongs', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.deleteSongs).mockResolvedValue(true);
    const result = await repository.deleteSongs(['s1', 's2']);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.deleteSongs).toHaveBeenCalledWith(['s1', 's2']);
    expect(result).toBe(true);
  });

  it('removeSongsFromPlaylist calls removeSongsFromPlaylist', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.removeSongsFromPlaylist).mockResolvedValue(true);
    const result = await repository.removeSongsFromPlaylist('p1', ['s1']);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.removeSongsFromPlaylist).toHaveBeenCalledWith('p1', ['s1']);
    expect(result).toBe(true);
  });

  it('addSongsToPlaylist calls addSongsToPlaylist', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.addSongsToPlaylist).mockResolvedValue(true);
    const result = await repository.addSongsToPlaylist('p1', ['s1']);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.addSongsToPlaylist).toHaveBeenCalledWith('p1', ['s1']);
    expect(result).toBe(true);
  });

  it('deletePlaylist calls deletePlaylist', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.deletePlaylist).mockResolvedValue(true);
    const result = await repository.deletePlaylist('p1');
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.deletePlaylist).toHaveBeenCalledWith('p1');
    expect(result).toBe(true);
  });

  it('getPlaylistById returns library data when id is 0', async () => {
    const mockSongs = [{ id: 's1' }] as Song[];
    const mockLibrary = { id: 'lib1' } as Playlist;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibrary).mockResolvedValue({ songs: mockSongs, library: mockLibrary });
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylists).mockResolvedValue([]);
    
    const result = await repository.getPlaylistById('0');
    expect(result).toEqual({ ...mockLibrary, songs: mockSongs, songCount: 1 });
  });

  it('getPlaylistById returns library data when id matches library id', async () => {
    const mockSongs = [{ id: 's1' }] as Song[];
    const mockLibrary = { id: 'lib1' } as Playlist;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibrary).mockResolvedValue({ songs: mockSongs, library: mockLibrary });
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylists).mockResolvedValue([]);
    
    const result = await repository.getPlaylistById('lib1');
    expect(result).toEqual({ ...mockLibrary, songs: mockSongs, songCount: 1 });
  });

  it('getPlaylistById returns null if playlist not found', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibrary).mockResolvedValue({ songs: [], library: { id: 'lib1' } });
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylists).mockResolvedValue([{ id: 'p2' }]);
    
    const result = await repository.getPlaylistById('p1');
    expect(result).toBeNull();
  });

  it('getPlaylistById returns playlist with its songs', async () => {
    const mockSongs = [{ id: 's1' }, { id: 's2' }, { id: 's3' }] as Song[];
    const mockPlaylist = { id: 'p1', songIds: ['s1', 's3'] } as Playlist;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibrary).mockResolvedValue({ songs: mockSongs, library: { id: 'lib1' } });
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylists).mockResolvedValue([mockPlaylist]);
    
    const result = await repository.getPlaylistById('p1');
    expect(result).toEqual({
      ...mockPlaylist,
      songs: [{ id: 's1' }, { id: 's3' }],
      songCount: 2
    });
  });

  it('importFiles calls importFiles', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.importFiles).mockResolvedValue({ imported: 1 });
    const result = await repository.importFiles();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.importFiles).toHaveBeenCalled();
    expect(result).toEqual({ imported: 1 });
  });

  it('importFolder calls importFolder', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.importFolder).mockResolvedValue({ imported: 2 });
    const result = await repository.importFolder();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.importFolder).toHaveBeenCalled();
    expect(result).toEqual({ imported: 2 });
  });

  it('addSongs calls addSongs', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.addSongs).mockResolvedValue({ success: true, count: 1 });
    const result = await repository.addSongs([{ id: 's1' } as Song]);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.addSongs).toHaveBeenCalledWith([{ id: 's1' }]);
    expect(result).toEqual({ success: true, count: 1 });
  });

  it('scanMissingFiles calls scanMissingFiles', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.scanMissingFiles).mockResolvedValue([{ id: 's1' }]);
    const result = await repository.scanMissingFiles();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.scanMissingFiles).toHaveBeenCalled();
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('runAutoImportScan calls runAutoImportScan', async () => {
    const mockResult = { added: 1, migrated: 0, totalScanned: 1, details: [] };
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.runAutoImportScan).mockResolvedValue(mockResult);
    const result = await repository.runAutoImportScan(['path/to/folder']);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.runAutoImportScan).toHaveBeenCalledWith(['path/to/folder']);
    expect(result).toEqual(mockResult);
  });

  it('getLyrics calls getLyrics', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLyrics).mockResolvedValue('lyrics text');
    const result = await repository.getLyrics('s1');
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLyrics).toHaveBeenCalledWith('s1');
    expect(result).toBe('lyrics text');
  });

  it('saveLyrics calls saveLyrics', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.saveLyrics).mockResolvedValue(true);
    const result = await repository.saveLyrics('s1', 'lyrics text', 123);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.saveLyrics).toHaveBeenCalledWith('s1', 'lyrics text', 123);
    expect(result).toBe(true);
  });

  it('searchLyrics calls searchLyrics', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.searchLyrics).mockResolvedValue([{ id: 1 }]);
    const result = await repository.searchLyrics('query');
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.searchLyrics).toHaveBeenCalledWith('query');
    expect(result).toEqual([{ id: 1 }]);
  });

  it('patchSong calls patchSong', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.patchSong).mockResolvedValue({ id: 's1' });
    const result = await repository.patchSong('s1', { title: 'New' });
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.patchSong).toHaveBeenCalledWith('s1', { title: 'New' });
    expect(result).toEqual({ id: 's1' });
  });

  it('getSettings calls getSettings', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSettings).mockResolvedValue({ theme: 'dark' });
    const result = await repository.getSettings();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSettings).toHaveBeenCalled();
    expect(result).toEqual({ theme: 'dark' });
  });

  it('getSyncHistory calls getSyncHistory', async () => {
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSyncHistory).mockResolvedValue([]);
    const result = await repository.getSyncHistory();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSyncHistory).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('clearSyncHistory calls clearSyncHistory', async () => {
    await repository.clearSyncHistory();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.clearSyncHistory).toHaveBeenCalled();
  });

  it('logSyncEvent calls logSyncEvent', async () => {
    const stats = { scanned: 1 } as any;
    await repository.logSyncEvent(stats, ['detail']);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.logSyncEvent).toHaveBeenCalledWith(stats, ['detail']);
  });
});
