import { useState, useEffect, useCallback } from 'react';
import type { Playlist, PlaylistDetail, Song } from '@music/types';
import { useLibraryContext } from '@music/hooks';
import { useNotification, useLanguage } from '@hooks';

export const usePlaylistData = (id: string | undefined) => {
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'library' | 'playlist' | null>(null);

  const {
    handleImportFiles,
    handleImportFolder,
    handleGetPlaylistDetail,
    handleUpdatePlaylist,
    handleUpdateSong,
    handleDeleteSong,
    handleDeleteSongs,
    handleRemoveSongsFromPlaylist,
    handleAddSongsToPlaylist,
    playlists,
    libraryVersion,
  } = useLibraryContext();

  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const isLibrary = id === '0';

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setIsLoading(true);
    setPlaylist(null);
    setLocalSongs([]);
  }

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      handleGetPlaylistDetail(id)
        .then((data: PlaylistDetail | null) => {
          if (data) {
            setPlaylist(data);
            setLocalSongs(data.songs || []);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [id, libraryVersion, handleGetPlaylistDetail]);

  const onSaveMetadata = useCallback(async (updated: Song | Playlist) => {
    if (editingSong) {
      const result = await handleUpdateSong(updated as Song);
      if (result) {
        setLocalSongs((prev) => prev.map((s) => (s.id === result.id ? result : s)));
        showNotification('success', t('playlist.updateSongSuccess'));
      }
    } else if (playlist) {
      const result = await handleUpdatePlaylist(updated as Playlist);
      if (result) {
        setPlaylist((prev) => (prev ? { ...prev, ...result } : null));
        showNotification('success', t('playlist.updateSuccess'));
      }
    }
    setEditingSong(null);
  }, [editingSong, playlist, handleUpdateSong, handleUpdatePlaylist, showNotification, t]);

  const confirmDeleteSong = useCallback(async () => {
    if (!deletingSong) return;
    const success = await handleDeleteSong(deletingSong.id);
    if (success) {
      setLocalSongs((prev) => prev.filter((s) => s.id !== deletingSong.id));
      showNotification('success', t('playlist.deleteSongSuccess'));
      setDeletingSong(null);
      return true;
    }
    return false;
  }, [deletingSong, handleDeleteSong, showNotification, t]);

  const confirmBulkDelete = useCallback(async (selectedIds: Set<string>) => {
    if (!bulkDeleteMode || selectedIds.size === 0) return false;
    const ids = Array.from(selectedIds);
    let success = false;
    if (bulkDeleteMode === 'library') {
      success = await handleDeleteSongs(ids);
    } else if (id) {
      success = await handleRemoveSongsFromPlaylist(id, ids);
    }
    if (success) {
      setLocalSongs((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      showNotification('success', t('playlist.bulkDeleteSuccess', { count: selectedIds.size }));
      setBulkDeleteMode(null);
      return true;
    }
    return false;
  }, [bulkDeleteMode, id, handleDeleteSongs, handleRemoveSongsFromPlaylist, showNotification, t]);

  const onImportFiles = useCallback(async () => {
    setIsImporting(true);
    try {
      const res = await handleImportFiles();
      if (res.success && res.count > 0) {
        showNotification('success', t('playlist.importSuccess', { count: res.count }));
        if (isLibrary && id) {
          const updated = await handleGetPlaylistDetail(id);
          if (updated) setLocalSongs(updated.songs);
        }
      }
    } finally {
      setIsImporting(false);
    }
  }, [handleImportFiles, showNotification, t, isLibrary, id, handleGetPlaylistDetail]);

  const onImportFolder = useCallback(async () => {
    setIsImporting(true);
    try {
      const res = await handleImportFolder();
      if (res.success && res.count > 0) {
        showNotification('success', t('playlist.scanSuccess', { count: res.count }));
        if (isLibrary && id) {
          const updated = await handleGetPlaylistDetail(id);
          if (updated) setLocalSongs(updated.songs);
        }
      }
    } finally {
      setIsImporting(false);
    }
  }, [handleImportFolder, showNotification, t, isLibrary, id, handleGetPlaylistDetail]);

  const onAddSongsToPlaylist = useCallback(async (playlistId: string, songIds: string[]) => {
    const targetPlaylist = playlists.find((p: Playlist) => p.id === playlistId);
    if (!targetPlaylist) return false;
    const success = await handleAddSongsToPlaylist(playlistId, songIds);
    if (success) {
      showNotification('success', t('playlist.addSongsSuccess', { count: songIds.length, name: targetPlaylist.name }));
      if (id === playlistId) {
        const updated = await handleGetPlaylistDetail(id);
        if (updated) {
          setPlaylist(updated);
          setLocalSongs(updated.songs);
        }
      }
      return true;
    }
    return false;
  }, [playlists, handleAddSongsToPlaylist, showNotification, t, id, handleGetPlaylistDetail]);

  return {
    playlist,
    localSongs,
    setLocalSongs,
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
  };
};
