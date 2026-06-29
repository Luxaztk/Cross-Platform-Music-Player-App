import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageAdapter } from '../../../infrastructure/storage/MobileStorageAdapter';
import { LIBRARY_PLAYLIST_KEY, SONGS_BY_ID_KEY, PLAYLISTS_BY_ID_KEY, PLAYER_STATE_KEY, RECENT_SEARCHES_KEY, STORAGE_VERSION_KEY, STORAGE_VERSION } from '../../../infrastructure/storage/keys';
import type { Song, Playlist } from '@music/types';

describe('MobileStorageAdapter', () => {
  let adapter: MobileStorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MobileStorageAdapter();
  });

  it('hydrates storage if version key is missing', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null); // version is null
    vi.mocked(AsyncStorage.multiGet).mockResolvedValueOnce([
      [LIBRARY_PLAYLIST_KEY, null],
      [SONGS_BY_ID_KEY, null],
      [PLAYLISTS_BY_ID_KEY, null],
      [PLAYER_STATE_KEY, null],
      [RECENT_SEARCHES_KEY, null],
    ]);

    await adapter.getLibrary();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(LIBRARY_PLAYLIST_KEY, expect.any(String));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(SONGS_BY_ID_KEY, JSON.stringify({}));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_VERSION_KEY, STORAGE_VERSION);
  });

  it('does not re-hydrate if already hydrated', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(STORAGE_VERSION);
    await adapter.getLibrary();
    await adapter.getLibrary();
    // multiGet should not be called
    expect(AsyncStorage.multiGet).not.toHaveBeenCalled();
    // getItem should be called for LIBRARY_PLAYLIST_KEY twice, and STORAGE_VERSION once
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(LIBRARY_PLAYLIST_KEY);
  });

  it('saves and retrieves songs', async () => {
    const mockSongs: Record<string, Song> = {
      '1': { id: '1', title: 'Test Song', artist: 'Artist', artists: ['Artist'], album: '', genre: '', year: 2024, coverArt: null, fileSize: 1024, dateAdded: '', sourceUrl: '', filePath: 'file://test', duration: 100 } as Song
    };

    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key: string) => {
      if (key === STORAGE_VERSION_KEY) return STORAGE_VERSION;
      if (key === SONGS_BY_ID_KEY) return JSON.stringify(mockSongs);
      return null;
    });

    const songs = await adapter.getSongs();
    expect(songs).toEqual(mockSongs);

    await adapter.saveSongs(mockSongs);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(SONGS_BY_ID_KEY, JSON.stringify(mockSongs));
  });

  it('saves and retrieves library playlist', async () => {
    const mockLibrary: Playlist = { id: '0', name: 'Library', description: '', songIds: ['1'], createdAt: '' } as Playlist;
    
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key: string) => {
      if (key === STORAGE_VERSION_KEY) return STORAGE_VERSION;
      if (key === LIBRARY_PLAYLIST_KEY) return JSON.stringify(mockLibrary);
      return null;
    });

    const library = await adapter.getLibrary();
    expect(library).toEqual(mockLibrary);

    await adapter.saveLibrary(mockLibrary);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(LIBRARY_PLAYLIST_KEY, JSON.stringify(mockLibrary));
  });

  it('composes library into playlists', async () => {
    const mockLibrary: Playlist = { id: '0', name: 'Library', description: '', songIds: ['1'], createdAt: '' } as Playlist;
    const mockUserPlaylist: Playlist = { id: '1', name: 'My Playlist', description: '', songIds: ['1'], createdAt: '' } as Playlist;

    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key: string) => {
      if (key === STORAGE_VERSION_KEY) return STORAGE_VERSION;
      if (key === LIBRARY_PLAYLIST_KEY) return JSON.stringify(mockLibrary);
      if (key === PLAYLISTS_BY_ID_KEY) return JSON.stringify({ '1': mockUserPlaylist });
      return null;
    });

    const playlists = await adapter.getPlaylists();
    expect(playlists).toHaveProperty('0');
    expect(playlists['0']).toEqual(mockLibrary);
    expect(playlists['1']).toEqual(mockUserPlaylist);
  });
});
