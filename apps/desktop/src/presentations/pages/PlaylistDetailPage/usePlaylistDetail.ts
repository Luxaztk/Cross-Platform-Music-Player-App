import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePlayer, useLibraryContext } from '@music/hooks';
import type { Song } from '@music/types';
import { useLanguage, useTheme, useLocalFilter, type SearchKey } from '@hooks';
import { splitArtists } from '@music/core';
import { type UsePlaylistDetailReturn } from './types';

// Sub-hooks
import { usePlaylistData } from './hooks/usePlaylistData';
import { usePlaylistVirtualization } from './hooks/usePlaylistVirtualization';
import { usePlaylistSelection } from './hooks/usePlaylistSelection';
import { usePlaylistMenu } from './hooks/usePlaylistMenu';

export const usePlaylistDetail = (): UsePlaylistDetailReturn => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const { playList, playNext, addToQueue, addSongsToQueue, currentSong } = usePlayer();
  const { libraryFilter, setLibraryFilter, songs: allSongs } = useLibraryContext();

  // 1. Data Hook
  const {
    playlist,
    localSongs,
    isLoading,
    isEditModalOpen,
    setIsEditModalOpen,
    isImporting,
    editingSong,
    setEditingSong,
    deletingSong,
    setDeletingSong,
    bulkDeleteMode,
    setBulkDeleteMode,
    isLibrary,
    onSaveMetadata,
    confirmDeleteSong,
    confirmBulkDelete,
    onImportFiles,
    onImportFolder,
    onAddSongsToPlaylist,
    playlists,
  } = usePlaylistData(id);

  // 2. Filter Logic (Keep here as it links localSongs and filteredSongs)
  const filterKeys = useMemo<SearchKey<Song>[]>(() => [
    (song) => {
      if (libraryFilter.type === 'artist') {
        return (song.artists || [song.artist]).flatMap(a => splitArtists(a));
      }
      if (libraryFilter.type === 'album') {
        return song.album;
      }
      return null;
    }
  ], [libraryFilter.type]);

  const [filteredByLibrary, isDebouncing] = useLocalFilter(
    localSongs,
    libraryFilter.values,
    filterKeys,
    { matchMode: libraryFilter.type === 'artist' ? 'all' : 'any' }
  );

  const filteredSongs = useMemo(() => {
    return [...filteredByLibrary].sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredByLibrary]);

  const totalDuration = useMemo(() => 
    filteredSongs.reduce((acc, song) => acc + (song.duration || 0), 0),
    [filteredSongs]
  );

  // 3. Selection Hook
  const {
    selectedIds,
    setSelectedIds,
    toggleSelectAll,
    toggleSelect
  } = usePlaylistSelection(id, filteredSongs, isLibrary, setBulkDeleteMode);

  // 4. Virtualization Hook
  const {
    scrollTop,
    isHeaderSticky,
    containerRef,
    visibleSongs,
    totalHeight,
    paddingOffset,
    startIndex
  } = usePlaylistVirtualization(filteredSongs);

  // 5. Menu Hook
  const {
    activeMenuId,
    setActiveMenuId,
    activeSubMenuId,
    setActiveSubMenuId,
    menuPosition,
    menuRef,
    toggleMenu
  } = usePlaylistMenu();

  // --- Handlers ---
  const handleBulkAddToQueue = useCallback(() => {
    const selectedSongs = filteredSongs.filter((song) => selectedIds.has(song.id));
    if (selectedSongs.length > 0) {
      addSongsToQueue(selectedSongs);
      setSelectedIds(new Set());
    }
  }, [filteredSongs, selectedIds, addSongsToQueue, setSelectedIds]);

  const toggleFilter = useCallback((type: 'artist' | 'album', value: string) => {
    if (libraryFilter.type !== type && libraryFilter.type !== 'none') {
      setLibraryFilter({ type, values: [value] });
      return;
    }

    const currentValues = libraryFilter.values;
    const index = currentValues.indexOf(value);

    if (index > -1) {
      const next = currentValues.filter((v) => v !== value);
      setLibraryFilter({
        type: next.length === 0 ? 'none' : type,
        values: next,
      });
    } else {
      setLibraryFilter({
        type,
        values: [...currentValues, value],
      });
    }
  }, [libraryFilter, setLibraryFilter]);

  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);

  // Reset filter on unmount or ID change
  useEffect(() => {
    return () => {
      setLibraryFilter({ type: 'none', values: [] });
    };
  }, [id, setLibraryFilter]);

  return {
    state: {
      playlist,
      localSongs,
      filteredSongs,
      visibleSongs,
      selectedIds,
      activeMenuId,
      activeSubMenuId,
      menuPosition,
      scrollTop,
      isHeaderSticky,
      isEditModalOpen,
      isImporting,
      isLoading,
      isSongPickerOpen,
      isDebouncing,
      editingSong,
      deletingSong,
      bulkDeleteMode,
      isLibrary,
      totalDuration,
      totalHeight,
      paddingOffset,
      startIndex
    },
    refs: {
      containerRef,
      menuRef
    },
    actions: {
      onSaveMetadata,
      onDeleteSong: (song) => {
        setDeletingSong(song);
        setActiveMenuId(null);
      },
      confirmDeleteSong: async () => {
        const success = await confirmDeleteSong();
        if (success && deletingSong) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(deletingSong.id);
            return next;
          });
        }
      },
      confirmBulkDelete: async () => {
        const success = await confirmBulkDelete(selectedIds);
        if (success) setSelectedIds(new Set());
      },
      toggleSelect,
      toggleSelectAll,
      onBulkAddToQueue: handleBulkAddToQueue,
      toggleFilter,
      onImportFiles,
      onImportFolder,
      onAddFromSystem: () => setIsSongPickerOpen(true),
      onAddSongsToPlaylist: async (pid, sids) => {
        await onAddSongsToPlaylist(pid, sids);
      },
      toggleMenu,
      setLibraryFilter,
      setIsEditModalOpen,
      setEditingSong,

      setDeletingSong,
      setBulkDeleteMode,
      setIsSongPickerOpen,
      setSelectedIds,
      setActiveMenuId,
      setActiveSubMenuId,
      playList,
      playNext,
      addToQueue
    },
    utils: {
      t,
      appIcon,
      playlists,
      allSongs,
      currentSong,
      id,
      libraryFilter
    }
  };
};
