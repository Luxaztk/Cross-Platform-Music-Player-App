import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from '../../../application/hooks/useRecentSearches';
import type { RecentSearch } from '@music/types';

const { mockGetRecentSearches, mockSaveRecentSearches } = vi.hoisted(() => ({
  mockGetRecentSearches: vi.fn().mockResolvedValue([]),
  mockSaveRecentSearches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../infrastructure/services/ElectronStorageAdapter', () => ({
  ElectronStorageAdapter: class {
    getRecentSearches = mockGetRecentSearches;
    saveRecentSearches = mockSaveRecentSearches;
  }
}));

describe('useRecentSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockGetRecentSearches.mockResolvedValue([]);
    mockSaveRecentSearches.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should load initial searches from storage', async () => {
    const mockData: RecentSearch[] = [{ type: 'query', text: 'test', timestamp: 123 }];
    mockGetRecentSearches.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.recentSearches).toEqual([]);

    await act(async () => {
      // Flush promises
      await Promise.resolve();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.recentSearches).toEqual(mockData);
    expect(mockGetRecentSearches).toHaveBeenCalledTimes(1);
  });

  it('should handle load error gracefully', async () => {
    mockGetRecentSearches.mockRejectedValue(new Error('Load error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.recentSearches).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load recent searches:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should add new query search', async () => {
    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    vi.setSystemTime(new Date(1000));

    act(() => {
      result.current.addSearch({ type: 'query', text: 'new query' });
    });

    expect(result.current.recentSearches).toEqual([
      { type: 'query', text: 'new query', timestamp: 1000 }
    ]);
    expect(mockSaveRecentSearches).toHaveBeenCalledWith([{ type: 'query', text: 'new query', timestamp: 1000 }]);
  });

  it('should add new entity search', async () => {
    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    vi.setSystemTime(new Date(2000));

    act(() => {
      result.current.addSearch({ type: 'entity', entityType: 'artist', id: 'a1', name: 'Artist 1' });
    });

    expect(result.current.recentSearches).toEqual([
      { type: 'entity', entityType: 'artist', id: 'a1', name: 'Artist 1', timestamp: 2000 }
    ]);
  });

  it('should remove duplicate query and move to front', async () => {
    const mockData: RecentSearch[] = [
      { type: 'query', text: 'old', timestamp: 100 },
      { type: 'query', text: 'duplicate', timestamp: 200 }
    ];
    mockGetRecentSearches.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    vi.setSystemTime(new Date(1000));

    act(() => {
      result.current.addSearch({ type: 'query', text: 'duplicate' });
    });

    // 'duplicate' should be at the front with new timestamp, 'old' comes after
    expect(result.current.recentSearches).toEqual([
      { type: 'query', text: 'duplicate', timestamp: 1000 },
      { type: 'query', text: 'old', timestamp: 100 }
    ]);
  });

  it('should limit to 5 queries and 5 entities', async () => {
    const mockData: RecentSearch[] = [];
    for (let i = 0; i < 5; i++) {
      mockData.push({ type: 'query', text: `q${i}`, timestamp: i });
      mockData.push({ type: 'entity', entityType: 'artist', id: `a${i}`, name: `a${i}`, timestamp: i });
    }
    mockGetRecentSearches.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    vi.setSystemTime(new Date(1000));

    act(() => {
      result.current.addSearch({ type: 'query', text: 'q_new' });
      result.current.addSearch({ type: 'entity', entityType: 'artist', id: 'a_new', name: 'a_new' });
    });

    const queries = result.current.recentSearches.filter(s => s.type === 'query');
    const entities = result.current.recentSearches.filter(s => s.type === 'entity');

    expect(queries).toHaveLength(5);
    expect(entities).toHaveLength(5);
    expect(queries[0].text).toBe('q_new'); // newest first
    expect(entities[0].name).toBe('a_new');
  });

  it('should remove search by timestamp', async () => {
    const mockData: RecentSearch[] = [
      { type: 'query', text: 'old', timestamp: 100 },
      { type: 'query', text: 'keep', timestamp: 200 }
    ];
    mockGetRecentSearches.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.removeSearch(100);
    });

    expect(result.current.recentSearches).toEqual([
      { type: 'query', text: 'keep', timestamp: 200 }
    ]);
  });

  it('should clear all searches', async () => {
    const mockData: RecentSearch[] = [
      { type: 'query', text: 'old', timestamp: 100 }
    ];
    mockGetRecentSearches.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.recentSearches).toEqual([]);
    expect(mockSaveRecentSearches).toHaveBeenCalledWith([]);
  });

  it('should handle save error gracefully', async () => {
    mockSaveRecentSearches.mockRejectedValue(new Error('Save error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useRecentSearches());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.clearAll();
    });

    // Wait for the async save error to be caught
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save recent searches:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
