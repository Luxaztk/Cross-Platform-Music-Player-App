import { useState, useMemo, useCallback } from 'react';
import type { Song } from '@music/types';
import { useTheme, useLanguage, useClusteredSearch } from '@hooks';

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

  // Use the new clustered search hook which handles debounce, filter and group
  const { clusteredResults, debouncedQuery, isDebouncing } = useClusteredSearch(availableSongs, searchQuery);

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
