import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearch } from '../../../application/hooks/useSearch';
import { useDebounce } from '../../../application/hooks/useDebounce';
import type { Song, Playlist } from '@music/types';

vi.mock('../../../application/hooks/useDebounce');

describe('useSearch', () => {
  const mockSongs = [
    { id: '1', title: 'Ảnh thẻ', artist: 'Huy Tran, Binz', album: 'Tuyet Pham', coverArt: 'cover.jpg' } as Song,
    { id: '2', title: 'Beautiful', artist: 'Eminem', album: 'Relapse' } as Song,
  ];

  const mockPlaylists = [
    { id: 'p1', name: 'Nhac Tre' } as Playlist,
    { id: 'p2', name: 'Rap Viet' } as Playlist,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: synchronous debounce
    vi.mocked(useDebounce).mockImplementation((value) => [value, false]);
  });

  it('should return empty results if query is empty', () => {
    const { result } = renderHook(() => useSearch(mockSongs, mockPlaylists, ''));

    expect(result.current.songs).toEqual([]);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.albums).toEqual([]);
    expect(result.current.artists).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('should return empty results if debouncedQuery is whitespace only', () => {
    vi.mocked(useDebounce).mockImplementation(() => ['   ', false]);
    const { result } = renderHook(() => useSearch(mockSongs, mockPlaylists, '   '));

    expect(result.current.songs).toEqual([]);
  });

  it('should search songs and playlists matching the query', () => {
    const { result } = renderHook(() => useSearch(mockSongs, mockPlaylists, 'Anh The'));

    expect(result.current.songs).toHaveLength(1);
    expect(result.current.songs[0].id).toBe('1');
    expect(result.current.playlists).toHaveLength(0);
    
    // It should extract albums and artists
    expect(result.current.albums).toHaveLength(1);
    expect(result.current.albums[0].name).toBe('Tuyet Pham');
    
    expect(result.current.artists).toHaveLength(2); // Huy Tran and Binz
  });

  it('should search playlists correctly', () => {
    const { result } = renderHook(() => useSearch(mockSongs, mockPlaylists, 'rap'));

    expect(result.current.songs).toHaveLength(0);
    expect(result.current.playlists).toHaveLength(1);
    expect(result.current.playlists[0].id).toBe('p2');
  });

  it('should extract artist and album info correctly without duplicates', () => {
    const duplicateArtistSongs = [
      { id: 's1', title: 'Song 1', artist: 'Binz', album: 'Album A' } as Song,
      { id: 's2', title: 'Song 2', artist: 'Binz', album: 'Album A' } as Song,
    ];
    const { result } = renderHook(() => useSearch(duplicateArtistSongs, [], 'binz'));

    expect(result.current.songs).toHaveLength(2);
    // Album should only have 1 entry since it's the same Album A - Binz
    expect(result.current.albums).toHaveLength(1);
    expect(result.current.albums[0].name).toBe('Album A');
    
    // Artist should only have 1 entry
    expect(result.current.artists).toHaveLength(1);
    expect(result.current.artists[0].name).toBe('Binz');
  });

  it('should group confirmed artist aliases under one canonical artist', () => {
    const aliasSongs = [
      { id: 's1', title: 'Song 1', artist: '(S)TRONG' } as Song,
      { id: 's2', title: 'Song 2', artist: '(S)TRONG Trọng Hiếu' } as Song,
      { id: 's3', title: 'Song 3', artist: 'BẰNG KIỀU' } as Song,
      { id: 's4', title: 'Song 4', artist: 'Bằng Kiều' } as Song,
    ];

    const strongResult = renderHook(() => useSearch(aliasSongs, [], 'TRONG'));
    expect(strongResult.result.current.artists).toEqual([
      expect.objectContaining({ name: '(S)TRONG' }),
    ]);

    const bangKieuResult = renderHook(() => useSearch(aliasSongs, [], 'Kiều'));
    expect(bangKieuResult.result.current.artists).toEqual([
      expect.objectContaining({ name: 'Bằng Kiều' }),
    ]);
  });

  it('should handle missing album field gracefully', () => {
    const noAlbumSongs = [
      { id: 's1', title: 'Song X', artist: 'Artist X' } as Song,
    ];
    const { result } = renderHook(() => useSearch(noAlbumSongs, [], 'Song'));

    expect(result.current.albums).toHaveLength(0);
    expect(result.current.artists).toHaveLength(1);
  });

  it('should return isSearching state correctly', () => {
    vi.mocked(useDebounce).mockImplementation((value) => [value, true]);
    const { result } = renderHook(() => useSearch(mockSongs, mockPlaylists, 'a'));

    expect(result.current.isSearching).toBe(true);
  });
});
