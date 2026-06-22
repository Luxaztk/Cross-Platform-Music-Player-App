import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectronStorageAdapter } from '../../../infrastructure/services/ElectronStorageAdapter';
import type { Song, Playlist, PlayerState, RecentSearch } from '@music/types';

describe('ElectronStorageAdapter', () => {
  let adapter: ElectronStorageAdapter;

  beforeEach(() => {
    adapter = new ElectronStorageAdapter();
    
    // Mock window.electronAPI
    (window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI = {
      getLibraryData: vi.fn(),
      getSongsData: vi.fn(),
      saveSongsData: vi.fn(),
      saveLibraryData: vi.fn(),
      savePlaylistsData: vi.fn(),
      getPlaylistsData: vi.fn(),
      getPlayerState: vi.fn(),
      savePlayerState: vi.fn(),
      getRecentSearches: vi.fn(),
      saveRecentSearches: vi.fn(),
      getLyricUsage: vi.fn(),
      saveLyricUsage: vi.fn(),
      incrementLyricUsage: vi.fn(),
      patchSong: vi.fn(),
      resetCache: vi.fn(),
    };
  });

  it('getLibrary calls getLibraryData', async () => {
    const mockLibrary = { id: 'lib1' } as Playlist;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibraryData).mockResolvedValue(mockLibrary);
    
    const result = await adapter.getLibrary();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLibraryData).toHaveBeenCalled();
    expect(result).toEqual(mockLibrary);
  });

  it('getSongs calls getSongsData', async () => {
    const mockSongs = { s1: { id: 's1' } } as unknown as Record<string, Song>;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSongsData).mockResolvedValue(mockSongs);
    
    const result = await adapter.getSongs();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSongsData).toHaveBeenCalled();
    expect(result).toEqual(mockSongs);
  });

  it('saveSongs calls saveSongsData', async () => {
    const mockSongs = { s1: { id: 's1' } } as unknown as Record<string, Song>;
    await adapter.saveSongs(mockSongs);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.saveSongsData).toHaveBeenCalledWith(mockSongs);
  });

  it('saveLibrary calls saveLibraryData', async () => {
    const mockLibrary = { id: 'lib1' } as Playlist;
    await adapter.saveLibrary(mockLibrary);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.saveLibraryData).toHaveBeenCalledWith(mockLibrary);
  });

  it('savePlaylists calls savePlaylistsData', async () => {
    const mockPlaylists = { p1: { id: 'p1' } } as unknown as Record<string, Playlist>;
    await adapter.savePlaylists(mockPlaylists);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.savePlaylistsData).toHaveBeenCalledWith(mockPlaylists);
  });

  it('getPlaylists calls getPlaylistsData', async () => {
    const mockPlaylists = { p1: { id: 'p1' } } as unknown as Record<string, Playlist>;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylistsData).mockResolvedValue(mockPlaylists);
    
    const result = await adapter.getPlaylists();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlaylistsData).toHaveBeenCalled();
    expect(result).toEqual(mockPlaylists);
  });

  it('getPlayerState calls getPlayerState', async () => {
    const mockState = { currentSongId: 's1' } as PlayerState;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlayerState).mockResolvedValue(mockState);
    
    const result = await adapter.getPlayerState();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getPlayerState).toHaveBeenCalled();
    expect(result).toEqual(mockState);
  });

  it('savePlayerState calls savePlayerState', async () => {
    const mockState = { currentSongId: 's1' } as PlayerState;
    await adapter.savePlayerState(mockState);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.savePlayerState).toHaveBeenCalledWith(mockState);
  });

  it('getSongList returns Object.values(getSongs())', async () => {
    const mockSongs = { 
      s1: { id: 's1' },
      s2: { id: 's2' }
    } as unknown as Record<string, Song>;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSongsData).mockResolvedValue(mockSongs);
    
    const result = await adapter.getSongList();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getSongsData).toHaveBeenCalled();
    expect(result).toEqual([{ id: 's1' }, { id: 's2' }]);
  });

  it('getRecentSearches calls getRecentSearches', async () => {
    const mockSearches = [{ text: 'test' }] as RecentSearch[];
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getRecentSearches).mockResolvedValue(mockSearches);
    
    const result = await adapter.getRecentSearches();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getRecentSearches).toHaveBeenCalled();
    expect(result).toEqual(mockSearches);
  });

  it('saveRecentSearches calls saveRecentSearches', async () => {
    const mockSearches = [{ text: 'test' }] as RecentSearch[];
    await adapter.saveRecentSearches(mockSearches);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.saveRecentSearches).toHaveBeenCalledWith(mockSearches);
  });

  it('getLyricUsage calls getLyricUsage', async () => {
    const mockUsage = { l1: 1 };
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLyricUsage).mockResolvedValue(mockUsage);
    
    const result = await adapter.getLyricUsage();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.getLyricUsage).toHaveBeenCalled();
    expect(result).toEqual(mockUsage);
  });

  it('saveLyricUsage calls saveLyricUsage', async () => {
    const mockUsage = { l1: 1 };
    await adapter.saveLyricUsage(mockUsage);
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.saveLyricUsage).toHaveBeenCalledWith(mockUsage);
  });

  it('incrementLyricUsage calls incrementLyricUsage', async () => {
    await adapter.incrementLyricUsage('l1');
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.incrementLyricUsage).toHaveBeenCalledWith('l1');
  });

  it('patchSong calls patchSong', async () => {
    const mockSong = { id: 's1', title: 'New Title' } as Song;
    vi.mocked((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.patchSong).mockResolvedValue(mockSong);
    
    const result = await adapter.patchSong('s1', { title: 'New Title' });
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.patchSong).toHaveBeenCalledWith('s1', { title: 'New Title' });
    expect(result).toEqual(mockSong);
  });

  it('clear calls resetCache', async () => {
    await adapter.clear();
    expect((window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI.resetCache).toHaveBeenCalled();
  });
});
