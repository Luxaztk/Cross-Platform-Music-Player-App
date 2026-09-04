import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlaylistData } from '../../../../../presentations/pages/PlaylistDetailPage/hooks/usePlaylistData';
import { useLibraryContext } from '@music/hooks';
import { useNotification, useLanguage } from '@hooks';
import type { Song, Playlist } from '@music/types';

vi.mock('@music/hooks', () => ({
  useLibraryContext: vi.fn(),
}));

vi.mock('@hooks', () => ({
  useNotification: vi.fn(),
  useLanguage: vi.fn(),
}));

describe('usePlaylistData - Navigation & Loading State Verification', () => {
  const mockSongs: Song[] = [
    {
      id: 'song-1',
      filePath: 'C:\\Music\\song1.mp3',
      title: 'Song One',
      artist: 'Artist One',
      artists: ['Artist One'],
      album: 'Album One',
      duration: 200,
      genre: 'Pop',
      year: 2026,
      coverArt: null,
      sourceType: 'local',
    },
    {
      id: 'song-2',
      filePath: 'C:\\Music\\song2.mp3',
      title: 'Song Two',
      artist: 'Artist Two',
      artists: ['Artist Two'],
      album: 'Album Two',
      duration: 220,
      genre: 'Rock',
      year: 2026,
      coverArt: null,
      sourceType: 'local',
    },
  ];

  const mockLibrary: Playlist = {
    id: '0',
    name: 'Library',
    description: '',
    songIds: ['song-1', 'song-2'],
    thumbnail: undefined,
    createdAt: '2026-01-01',
  };

  const mockPlaylists: Playlist[] = [
    {
      id: 'pl-custom-1',
      name: 'Chill Vibes',
      description: '',
      songIds: ['song-1'],
      thumbnail: undefined,
      createdAt: '2026-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLanguage).mockReturnValue({
      t: vi.fn((key) => key),
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(useNotification).mockReturnValue({
      showNotification: vi.fn(),
    } as unknown as ReturnType<typeof useNotification>);

    vi.mocked(useLibraryContext).mockReturnValue({
      handleImportFiles: vi.fn(),
      handleImportFolder: vi.fn(),
      handleGetPlaylistDetail: vi.fn(),
      handleUpdatePlaylist: vi.fn(),
      handleUpdateSong: vi.fn(),
      handleDeleteSong: vi.fn(),
      handleDeleteSongs: vi.fn(),
      handleRemoveSongsFromPlaylist: vi.fn(),
      handleAddSongsToPlaylist: vi.fn(),
      playlists: mockPlaylists,
      songs: mockSongs,
      library: mockLibrary,
      isImporting: false,
    } as unknown as ReturnType<typeof useLibraryContext>);
  });

  it('loads library playlist (id = "0") immediately on mount without getting stuck in loading', () => {
    // Simulates navigating from SettingsPage back to Playlist 0 when library & songs are already loaded in memory
    const { result } = renderHook(() => usePlaylistData('0'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlist).not.toBeNull();
    expect(result.current.playlist?.id).toBe('0');
    expect(result.current.localSongs).toHaveLength(2);
    expect(result.current.isLibrary).toBe(true);
  });

  it('loads custom playlist immediately on mount without getting stuck in loading', () => {
    const { result } = renderHook(() => usePlaylistData('pl-custom-1'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlist).not.toBeNull();
    expect(result.current.playlist?.name).toBe('Chill Vibes');
    expect(result.current.localSongs).toHaveLength(1);
    expect(result.current.localSongs[0].id).toBe('song-1');
  });

  it('switches between playlists smoothly when route id changes', () => {
    let currentId = '0';
    const { result, rerender } = renderHook(() => usePlaylistData(currentId));

    expect(result.current.playlist?.id).toBe('0');
    expect(result.current.localSongs).toHaveLength(2);
    expect(result.current.isLoading).toBe(false);

    // User clicks another playlist in sidebar
    currentId = 'pl-custom-1';
    rerender();

    expect(result.current.playlist?.id).toBe('pl-custom-1');
    expect(result.current.localSongs).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('shows loading on cold start if library is not loaded yet, then resolves once library arrives', () => {
    let currentLibrary: Playlist | null = null;
    let currentSongs: Song[] = [];
    const emptyPlaylists: Playlist[] = [];

    vi.mocked(useLibraryContext).mockImplementation(() => ({
      playlists: emptyPlaylists,
      songs: currentSongs,
      library: currentLibrary,
      isImporting: false,
      handleImportFiles: vi.fn(),
      handleImportFolder: vi.fn(),
      handleGetPlaylistDetail: vi.fn(),
      handleUpdatePlaylist: vi.fn(),
      handleUpdateSong: vi.fn(),
      handleDeleteSong: vi.fn(),
      handleDeleteSongs: vi.fn(),
      handleRemoveSongsFromPlaylist: vi.fn(),
      handleAddSongsToPlaylist: vi.fn(),
    } as unknown as ReturnType<typeof useLibraryContext>));

    const { result, rerender } = renderHook(() => usePlaylistData('0'));

    // Cold start before storage loads
    expect(result.current.isLoading).toBe(true);
    expect(result.current.playlist).toBeNull();

    // Storage finishes loading
    currentLibrary = mockLibrary;
    currentSongs = mockSongs;
    rerender();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.playlist?.id).toBe('0');
    expect(result.current.localSongs).toHaveLength(2);
  });
});
