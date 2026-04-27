import { useMemo } from 'react';
import type { Song } from '@music/types';
import { useLocalFilter } from './useLocalFilter';
import { useDebounce } from './useDebounce';
import { groupAndSortSongs } from '../utils/searchUtils';

export interface ClusteredSearchResults {
  titles: Song[];
  artists: Song[];
  albums: Song[];
}

export interface ClusteredSearchReturn {
  filteredSongs: Song[];
  clusteredResults: ClusteredSearchResults;
  debouncedQuery: string;
  isDebouncing: boolean;
}

/**
 * Hook to handle both filtering and clustering of songs with built-in debounce.
 * 
 * @param songs The list of songs to search.
 * @param query The raw search query.
 * @returns An object containing filtered songs and clustered results.
 */
export const useClusteredSearch = (songs: Song[], query: string): ClusteredSearchReturn => {
  const [debouncedQuery, isDebouncing] = useDebounce(query, 250);

  // 1. Filter songs using the existing local filter (let it handle the debounce internally)
  const filterResult = useLocalFilter(songs, query, ['title', 'artist', 'album']);
  const filteredSongs: Song[] = filterResult[0];

  // 2. Group and sort the filtered results
  const clusteredResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { titles: filteredSongs, artists: [], albums: [] };
    }
    return groupAndSortSongs(filteredSongs, debouncedQuery);
  }, [filteredSongs, debouncedQuery]);

  return {
    filteredSongs,
    clusteredResults,
    debouncedQuery,
    isDebouncing
  };
};
