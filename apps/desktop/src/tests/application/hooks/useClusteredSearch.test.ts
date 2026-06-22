import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClusteredSearch } from '../../../application/hooks/useClusteredSearch';
import { useLocalFilter } from '../../../application/hooks/useLocalFilter';
import { useDebounce } from '../../../application/hooks/useDebounce';
import { groupAndSortSongs } from '../../../application/utils/searchUtils';
import type { Song } from '@music/types';

// Mock dependencies
vi.mock('../../../application/hooks/useLocalFilter');
vi.mock('../../../application/hooks/useDebounce');
vi.mock('../../../application/utils/searchUtils');

describe('useClusteredSearch', () => {
  const mockSongs: Song[] = [
    { id: '1', title: 'Song 1', artist: 'Artist 1' } as Song,
    { id: '2', title: 'Song 2', artist: 'Artist 2' } as Song,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state with empty query', () => {
    // Setup mocks
    vi.mocked(useDebounce).mockReturnValue(['', false]);
    vi.mocked(useLocalFilter).mockReturnValue([mockSongs, false]);
    
    const { result } = renderHook(() => useClusteredSearch(mockSongs, ''));

    expect(useDebounce).toHaveBeenCalledWith('', 250);
    expect(useLocalFilter).toHaveBeenCalledWith(mockSongs, '', ['title', 'artist', 'album']);
    expect(groupAndSortSongs).not.toHaveBeenCalled();

    expect(result.current.filteredSongs).toEqual(mockSongs);
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.isDebouncing).toBe(false);
    expect(result.current.clusteredResults).toEqual({
      titles: mockSongs,
      artists: [],
      albums: []
    });
  });

  it('should call groupAndSortSongs when query is provided', () => {
    const debouncedQuery = 'Song';
    const filteredSongs = [mockSongs[0]];
    const mockClustered = {
      titles: [mockSongs[0]],
      artists: [],
      albums: []
    };

    vi.mocked(useDebounce).mockReturnValue([debouncedQuery, false]);
    vi.mocked(useLocalFilter).mockReturnValue([filteredSongs, false]);
    vi.mocked(groupAndSortSongs).mockReturnValue(mockClustered);

    const { result } = renderHook(() => useClusteredSearch(mockSongs, 'Song'));

    expect(groupAndSortSongs).toHaveBeenCalledWith(filteredSongs, debouncedQuery);
    
    expect(result.current.filteredSongs).toEqual(filteredSongs);
    expect(result.current.debouncedQuery).toBe(debouncedQuery);
    expect(result.current.isDebouncing).toBe(false);
    expect(result.current.clusteredResults).toEqual(mockClustered);
  });

  it('should pass isDebouncing from useDebounce', () => {
    vi.mocked(useDebounce).mockReturnValue(['So', true]);
    vi.mocked(useLocalFilter).mockReturnValue([mockSongs, false]);
    vi.mocked(groupAndSortSongs).mockReturnValue({ titles: [], artists: [], albums: [] });

    const { result } = renderHook(() => useClusteredSearch(mockSongs, 'Son'));

    expect(result.current.isDebouncing).toBe(true);
    expect(result.current.debouncedQuery).toBe('So');
  });

  it('should not call groupAndSortSongs when debouncedQuery is only whitespace', () => {
    vi.mocked(useDebounce).mockReturnValue(['   ', false]);
    vi.mocked(useLocalFilter).mockReturnValue([mockSongs, false]);
    
    const { result } = renderHook(() => useClusteredSearch(mockSongs, '   '));

    expect(groupAndSortSongs).not.toHaveBeenCalled();
    expect(result.current.clusteredResults).toEqual({
      titles: mockSongs,
      artists: [],
      albums: []
    });
  });
});
