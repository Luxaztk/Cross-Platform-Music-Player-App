import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Song } from '@music/types';
import { usePlaybackExclusion } from '../../../application/hooks/usePlaybackExclusion';
import * as SettingsHook from '../../../application/hooks/useSettings';

vi.mock('../../../application/hooks/useSettings');

describe('usePlaybackExclusion Hook', () => {
  const mockUpdateSettings = vi.fn();

  const mockSong: Song = {
    id: 'song-1',
    filePath: 'C:/music/track1.mp3',
    title: 'Track 1',
    artist: 'Artist A',
    artists: ['Artist A'],
    album: 'Special Album',
    duration: 200,
    genre: 'Pop',
    year: 2024,
    coverArt: null,
  };

  const initialSettings = {
    playback: {
      excludedSongIds: ['song-excluded'],
      excludedAlbums: ['ambient sleep'],
      excludedPlaylists: ['playlist-special'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SettingsHook.useSettings).mockReturnValue({
      settings: initialSettings,
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
      isSaving: false,
    } as unknown as ReturnType<typeof SettingsHook.useSettings>);
  });

  it('correctly evaluates isSongExcluded', () => {
    const { result } = renderHook(() => usePlaybackExclusion());

    // Normal song
    expect(result.current.isSongExcluded(mockSong)).toBe(false);

    // Song with matching excluded ID
    expect(result.current.isSongExcluded({ ...mockSong, id: 'song-excluded' })).toBe(true);

    // Song with matching excluded Album
    expect(result.current.isSongExcluded({ ...mockSong, album: 'Ambient Sleep' })).toBe(true);

    // Song with intrinsic excludeFromDefault flag
    expect(result.current.isSongExcluded({ ...mockSong, excludeFromDefault: true })).toBe(true);
  });

  it('correctly evaluates isAlbumExcluded (case-insensitive & trimmed)', () => {
    const { result } = renderHook(() => usePlaybackExclusion());

    expect(result.current.isAlbumExcluded('Ambient Sleep')).toBe(true);
    expect(result.current.isAlbumExcluded('  ambient sleep  ')).toBe(true);
    expect(result.current.isAlbumExcluded('Other Album')).toBe(false);
    expect(result.current.isAlbumExcluded('')).toBe(false);
  });

  it('correctly evaluates isPlaylistExcluded', () => {
    const { result } = renderHook(() => usePlaybackExclusion());

    expect(result.current.isPlaylistExcluded('playlist-special')).toBe(true);
    expect(result.current.isPlaylistExcluded('playlist-normal')).toBe(false);
    expect(result.current.isPlaylistExcluded('')).toBe(false);
  });

  it('toggles song exclusion (adds when absent, removes when present)', async () => {
    const { result } = renderHook(() => usePlaybackExclusion());

    // Toggle song-1 (currently absent -> should add)
    await act(async () => {
      await result.current.toggleExcludeSong(mockSong);
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      playback: {
        excludedSongIds: ['song-excluded', 'song-1'],
        excludedAlbums: ['ambient sleep'],
        excludedPlaylists: ['playlist-special'],
      },
    });

    // Toggle song-excluded (currently present -> should remove)
    await act(async () => {
      await result.current.toggleExcludeSong({ ...mockSong, id: 'song-excluded' });
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      playback: {
        excludedSongIds: [],
        excludedAlbums: ['ambient sleep'],
        excludedPlaylists: ['playlist-special'],
      },
    });
  });

  it('toggles album exclusion (adds when absent, removes when present)', async () => {
    const { result } = renderHook(() => usePlaybackExclusion());

    // Add new album
    await act(async () => {
      await result.current.toggleExcludeAlbum('Special Album');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      playback: {
        excludedSongIds: ['song-excluded'],
        excludedAlbums: ['ambient sleep', 'Special Album'],
        excludedPlaylists: ['playlist-special'],
      },
    });

    // Remove existing album (case-insensitive)
    await act(async () => {
      await result.current.toggleExcludeAlbum('Ambient Sleep');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      playback: {
        excludedSongIds: ['song-excluded'],
        excludedAlbums: [],
        excludedPlaylists: ['playlist-special'],
      },
    });
  });

  it('toggles playlist exclusion (adds when absent, removes when present)', async () => {
    const { result } = renderHook(() => usePlaybackExclusion());

    // Add new playlist
    await act(async () => {
      await result.current.toggleExcludePlaylist('playlist-new');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      playback: {
        excludedSongIds: ['song-excluded'],
        excludedAlbums: ['ambient sleep'],
        excludedPlaylists: ['playlist-special', 'playlist-new'],
      },
    });

    // Remove existing playlist
    await act(async () => {
      await result.current.toggleExcludePlaylist('playlist-special');
    });

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      playback: {
        excludedSongIds: ['song-excluded'],
        excludedAlbums: ['ambient sleep'],
        excludedPlaylists: [],
      },
    });
  });
});
