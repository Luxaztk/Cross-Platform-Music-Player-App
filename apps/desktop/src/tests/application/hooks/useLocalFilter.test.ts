import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocalFilter } from '../../../application/hooks/useLocalFilter';
import { useDebounce } from '../../../application/hooks/useDebounce';
import { textMatches } from '../../../application/utils/searchUtils';

vi.mock('../../../application/hooks/useDebounce');
vi.mock('../../../application/utils/searchUtils', () => ({
  textMatches: vi.fn(),
}));

describe('useLocalFilter', () => {
  const items = [
    { id: 1, name: 'Apple', tags: ['fruit', 'red'], count: 10 },
    { id: 2, name: 'Banana', tags: ['fruit', 'yellow'], count: 5 },
    { id: 3, name: 'Carrot', tags: ['vegetable', 'orange'], count: 20 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: immediately return the query
    vi.mocked(useDebounce).mockImplementation((value) => [value, false]);
    
    // Default textMatches mock implementation
    vi.mocked(textMatches).mockImplementation((text, query) => {
      if (!text || !query) return false;
      return text.toLowerCase().includes(query.toLowerCase());
    });
  });

  it('should return all items when query is empty', () => {
    const { result } = renderHook(() => useLocalFilter(items, '', ['name']));
    expect(result.current[0]).toEqual(items);
  });

  it('should filter items based on a single string property', () => {
    const { result } = renderHook(() => useLocalFilter(items, 'apple', ['name']));
    expect(result.current[0]).toEqual([items[0]]);
    expect(textMatches).toHaveBeenCalled();
  });

  it('should filter items based on multiple string properties', () => {
    // Both 'name' and 'tags' (array of string)
    const { result } = renderHook(() => useLocalFilter(items, 'fruit', ['name', 'tags'] as (keyof typeof items[0])[]));
    expect(result.current[0]).toEqual([items[0], items[1]]);
  });

  it('should filter items based on number property', () => {
    const { result } = renderHook(() => useLocalFilter(items, '20', ['count']));
    expect(result.current[0]).toEqual([items[2]]);
  });

  it('should filter using a custom accessor function', () => {
    const accessor = (item: typeof items[0]) => item.tags[0]; // first tag
    const { result } = renderHook(() => useLocalFilter(items, 'fruit', [accessor]));
    expect(result.current[0]).toEqual([items[0], items[1]]);
  });

  it('should handle matchMode="any" (default) with multiple queries', () => {
    // Match 'Apple' OR 'Carrot'
    const { result } = renderHook(() => useLocalFilter(items, ['Apple', 'Carrot'], ['name']));
    expect(result.current[0]).toEqual([items[0], items[2]]);
  });

  it('should handle matchMode="all" with multiple queries', () => {
    // Match 'fruit' AND 'red'
    const { result } = renderHook(() => 
      useLocalFilter(items, ['fruit', 'red'], ['tags'] as (keyof typeof items[0])[], { matchMode: 'all' })
    );
    // Only Apple has both fruit and red
    expect(result.current[0]).toEqual([items[0]]);
  });

  it('should return empty array when no matches', () => {
    const { result } = renderHook(() => useLocalFilter(items, 'XYZ', ['name']));
    expect(result.current[0]).toEqual([]);
  });

  it('should ignore properties of unsupported types', () => {
    const mixedItems = [
      { id: 1, name: 'A', obj: { val: 1 } },
      { id: 2, name: 'B', obj: { val: 2 } },
    ] as Array<Record<string, unknown>> ;
    
    // Attempting to filter on 'obj' which is an object, not string/number/array
    const { result } = renderHook(() => useLocalFilter(mixedItems, 'val', ['obj']));
    expect(result.current[0]).toEqual([]);
  });

  it('should return isDebouncing state from useDebounce', () => {
    vi.mocked(useDebounce).mockImplementation((value) => [value, true]);
    const { result } = renderHook(() => useLocalFilter(items, 'a', ['name']));
    expect(result.current[1]).toBe(true);
  });
});
