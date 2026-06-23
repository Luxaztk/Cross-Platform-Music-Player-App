import { useState, useMemo, useCallback } from 'react';
import type { Song } from '@music/types';
import { useTheme, useLanguage, useSearch } from '@hooks';
import { groupAndSortSongs } from '../../../application/utils/searchUtils';

export const useSongPicker = (
  allSongs: Song[],
  existingSongIds: string[],
  onAdd: (selectedSongIds: string[]) => void,
  onClose: () => void
) => {
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter out songs already in the playlist
  const availableSongs = useMemo(() => {
    return allSongs.filter((song) => !existingSongIds.includes(song.id));
  }, [allSongs, existingSongIds]);

  // Use the robust useSearch from the Header (limit 100 for picker)
  const searchResults = useSearch(availableSongs, [], searchQuery, 100);

  const clusteredResults = useMemo(() => {
    if (!searchResults.debouncedQuery.trim()) {
      return { titles: availableSongs, artists: [], albums: [] };
    }
    return groupAndSortSongs(searchResults.songs, searchResults.debouncedQuery);
  }, [availableSongs, searchResults.songs, searchResults.debouncedQuery]);

  const debouncedQuery = searchResults.debouncedQuery;
  const isDebouncing = searchResults.isSearching;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAddAction = useCallback(() => {
    onAdd(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  }, [selectedIds, onAdd, onClose]);

  const totalResultsCount = (clusteredResults.titles?.length || 0) + 
                           (clusteredResults.artists?.length || 0) + 
                           (clusteredResults.albums?.length || 0);
  const isTrulyEmpty = totalResultsCount === 0;

  return {
    state: {
      searchQuery,
      selectedIds,
      clusteredResults,
      debouncedQuery,
      isDebouncing,
      isTrulyEmpty
    },
    actions: {
      setSearchQuery,
      toggleSelect,
      handleAdd: handleAddAction,
      onClose
    },
    utils: {
      t,
      appIcon
    }
  };
};
