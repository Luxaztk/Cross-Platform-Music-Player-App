import { useMemo } from 'react';
import { textMatches } from '../utils/searchUtils';
import { useDebounce } from './useDebounce';

/**
 * Accessor function type for custom field extraction.
 */
export type SearchAccessor<T> = (item: T) => string | string[] | number | undefined | null;

/**
 * SearchKey can be a key of the object or a custom accessor function.
 */
export type SearchKey<T> = keyof T | SearchAccessor<T>;

export interface FilterOptions {
  /**
   * Whether to match all queries (AND) or any query (OR). 
   * Defaults to 'any'.
   */
  matchMode?: 'any' | 'all';
}

/**
 * Generic hook for local filtering of data arrays.
 * 
 * @param items The data array to filter.
 * @param query The search query string or array of strings.
 * @param searchKeys List of keys or accessor functions to match against.
 * @param options Filtering options (matchMode).
 * @returns Filtered data array.
 */
export const useLocalFilter = <T>(
  items: T[],
  query: string | string[],
  searchKeys: SearchKey<T>[],
  options: FilterOptions = {}
): [T[], boolean] => {
  const { matchMode = 'any' } = options;
  const [debouncedQuery, isDebouncing] = useDebounce(query, 250);

  const filteredItems = useMemo(() => {
    const queries = Array.isArray(debouncedQuery) ? debouncedQuery : [debouncedQuery];
    const activeQueries = queries.map(q => q.trim()).filter(q => q !== '');
    
    if (activeQueries.length === 0) return items;

    return items.filter((item) => {
      // Determine if the item matches the queries based on matchMode
      const matches = activeQueries.map((q) => {
        return searchKeys.some((key) => {
          let value: unknown;
          
          if (typeof key === 'function') {
            value = key(item);
          } else {
            value = item[key];
          }

          // Handle Array of strings (e.g., artists: string[])
          if (Array.isArray(value)) {
            return (value as unknown[]).some((v) => 
              typeof v === 'string' && textMatches(v, q)
            );
          }

          // Handle String values
          if (typeof value === 'string') {
            return textMatches(value, q);
          }

          // Handle Number values
          if (typeof value === 'number') {
            return textMatches(value.toString(), q);
          }

          return false;
        });
      });

      if (matchMode === 'all') {
        return matches.every(m => m);
      }
      return matches.some(m => m);
    });
  }, [items, debouncedQuery, searchKeys, matchMode]);

  return [filteredItems, isDebouncing];
};
