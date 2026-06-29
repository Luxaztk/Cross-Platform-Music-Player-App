import { useState, useCallback } from 'react';
import type { Playlist, PlaylistDetail, Song } from '@music/types';
import { useLibraryContext } from '@music/hooks';
import { useNotification, useLanguage } from '@hooks';

export const usePlaylistData = (id: string | undefined) => {
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


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
    songs,
    library,
    isImporting,
  } = useLibraryContext();

  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const isLibrary = id === '0';

  const [prevDeps, setPrevDeps] = useState({ id, library, playlists, songs });

  if (
    id !== prevDeps.id ||
    library !== prevDeps.library ||
    playlists !== prevDeps.playlists ||
    songs !== prevDeps.songs
  ) {
    setPrevDeps({ id, library, playlists, songs });
    if (id) {
      if (id === '0' && library) {
        setPlaylist({ ...library, songs, songCount: songs.length });
        setLocalSongs(songs);
        setIsLoading(false);
      } else {
        const p = playlists.find(p => p.id === id);
        if (p) {
          const pSongs = p.songIds.map(sid => songs.find(s => s.id === sid)).filter(Boolean) as Song[];
          setPlaylist({ ...p, songs: pSongs, songCount: pSongs.length });
          setLocalSongs(pSongs);
        } else {
          setPlaylist(null);
          setLocalSongs([]);
        }
        setIsLoading(false);
      }
    }
  }

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
    let success = false;
    if (isLibrary) {
      success = await handleDeleteSong(deletingSong.id);
    } else if (id) {
      success = await handleRemoveSongsFromPlaylist(id, [deletingSong.id]);
    }
    
    if (success) {
      setLocalSongs((prev) => prev.filter((s) => s.id !== deletingSong.id));
      showNotification('success', t('playlist.deleteSongSuccess'));
      setDeletingSong(null);
      return true;
    }
    return false;
  }, [deletingSong, isLibrary, id, handleDeleteSong, handleRemoveSongsFromPlaylist, showNotification, t]);

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
    const res = await handleImportFiles();
    if (res.success && res.count > 0) {
      const key = res.totalAttempted === 1 ? 'playlist.importSuccess_singleFile' : 'playlist.importSuccess_multiFile';
      showNotification('success', t(key, { count: res.count }));
      if (isLibrary && id) {
        const updated = await handleGetPlaylistDetail(id);
        if (updated) setLocalSongs(updated.songs);
      }
    }
  }, [handleImportFiles, showNotification, t, isLibrary, id, handleGetPlaylistDetail]);

  const onImportFolder = useCallback(async () => {
    const res = await handleImportFolder();
    if (res.success && res.count > 0) {
      showNotification('success', t('playlist.importSuccess_singleFolder', { count: res.count }));
      if (isLibrary && id) {
        const updated = await handleGetPlaylistDetail(id);
        if (updated) setLocalSongs(updated.songs);
      }
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
