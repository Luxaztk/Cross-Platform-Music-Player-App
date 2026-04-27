import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  GetLibraryUseCase, 
  GetPlaylistsUseCase, 
  ImportFilesUseCase, 
  ImportFolderUseCase, 
  CreatePlaylistUseCase, 
  GetPlaylistByIdUseCase, 
  UpdatePlaylistUseCase, 
  UpdateSongUseCase, 
  PatchSongUseCase, 
  DeletePlaylistUseCase,
  DeleteSongUseCase,
  DeleteSongsUseCase,
  AddSongsToPlaylistUseCase,
  RemoveSongsFromPlaylistUseCase,
  ScanMissingFilesUseCase
} from '@music/core';

import type { Song, Playlist, DuplicateSongInfo, SyncStats } from '@music/types';

import { 
  LibraryDataContext, 
  LibraryActionsContext
} from '../LibraryContext';
import type { 
  SyncOptions, 
  SharedLibraryProviderProps 
} from '../types/index';







export const SharedLibraryProvider: React.FC<SharedLibraryProviderProps> = ({ 
  children, 
  repository, 
  onSyncComplete,
  onSyncStart,
  onSyncError 
}) => {

  const [songs, setSongs] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [duplicateSongs, setDuplicateSongs] = useState<DuplicateSongInfo[]>([]);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [libraryFilter, setLibraryFilter] = useState<{ type: 'artist' | 'album' | 'none'; values: string[] }>({ 
    type: 'none', 
    values: [] 
  });
  
  // Phase 1: Centralized Sync States
  const [isSyncing, setIsSyncing] = useState(false);
  const [missingSongs, setMissingSongs] = useState<Song[]>([]);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  
  // Guard against double initialization in StrictMode (Dev)
  const isInitialized = useRef(false);

  // Memoize UseCases to keep them stable
  const useCases = useMemo(() => ({
    getLibrary: new GetLibraryUseCase(repository),
    getPlaylists: new GetPlaylistsUseCase(repository),
    importFiles: new ImportFilesUseCase(repository),
    importFolder: new ImportFolderUseCase(repository),
    createPlaylist: new CreatePlaylistUseCase(repository),
    getPlaylistById: new GetPlaylistByIdUseCase(repository),
    updatePlaylist: new UpdatePlaylistUseCase(repository),
    updateSong: new UpdateSongUseCase(repository),
    patchSong: new PatchSongUseCase(repository),
    deletePlaylist: new DeletePlaylistUseCase(repository),
    deleteSong: new DeleteSongUseCase(repository),
    deleteSongs: new DeleteSongsUseCase(repository),
    addSongsToPlaylist: new AddSongsToPlaylistUseCase(repository),
    removeSongsFromPlaylist: new RemoveSongsFromPlaylistUseCase(repository),
    scanMissingFiles: new ScanMissingFilesUseCase(repository),
  }), [repository]);

  const fetchLibrary = useCallback(async () => {
    const data = await useCases.getLibrary.execute();
    setSongs(data.songs);
    setLibrary(data.library);
    setLibraryVersion(v => v + 1);
  }, [useCases]);

  const fetchPlaylists = useCallback(async () => {
    const data = await useCases.getPlaylists.execute();
    setPlaylists(data);
    setLibraryVersion(v => v + 1);
  }, [useCases]);

  const handleRunAutoImportScan = useCallback(async (paths: string[]) => {
    const result = await repository.runAutoImportScan(paths);
    if (result.added > 0 || result.migrated > 0) {
      await Promise.all([fetchLibrary(), fetchPlaylists()]);
    }
    return result;
  }, [repository, fetchLibrary, fetchPlaylists]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const init = async () => {
      await Promise.all([fetchLibrary(), fetchPlaylists()]);
      
      // Auto-import scan on startup
      try {
        const settings = await repository.getSettings();
        if (settings?.downloads?.autoImportPaths?.length > 0) {
          console.log('[Library] Triggering startup auto-import scan');
          await handleRunAutoImportScan(settings.downloads.autoImportPaths);
        }
      } catch (err) {
        console.error('[Library] Startup auto-import scan failed', err);
      }
    };
    init();
  }, [fetchLibrary, fetchPlaylists, handleRunAutoImportScan, repository]);

  const handleImportFiles = useCallback(async () => {
    const res = await useCases.importFiles.execute();
    if (res.success) {
      if (res.count > 0) {
        await fetchLibrary();
        await fetchPlaylists();
      }
      if (res.duplicateSongs && res.duplicateSongs.length > 0) {
        setDuplicateSongs(res.duplicateSongs);
      }
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleImportFolder = useCallback(async () => {
    const res = await useCases.importFolder.execute();
    if (res.success) {
      if (res.count > 0) {
        await fetchLibrary();
        await fetchPlaylists();
      }
      if (res.duplicateSongs && res.duplicateSongs.length > 0) {
        setDuplicateSongs(res.duplicateSongs);
      }
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleAddSongs = useCallback(async (songsToAdd: Song[]) => {
    const res = await repository.addSongs(songsToAdd);
    if (res.success) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    setDuplicateSongs([]); // Clear after resolution
    return res;
  }, [repository, fetchLibrary, fetchPlaylists]);

  const clearDuplicates = useCallback(() => setDuplicateSongs([]), []);

  const handleCreatePlaylist = useCallback(async (name: string = 'New Playlist') => {
    const newPlaylist = await useCases.createPlaylist.execute(name);
    await fetchPlaylists();
    return newPlaylist;
  }, [useCases, fetchPlaylists]);

  const handleGetPlaylistDetail = useCallback(async (id: string) => {
    return await useCases.getPlaylistById.execute(id);
  }, [useCases]);

  const handleUpdatePlaylist = useCallback(async (p: Playlist) => {
    const updated = await useCases.updatePlaylist.execute(p);
    await fetchPlaylists();
    return updated;
  }, [useCases, fetchPlaylists]);

  const handleUpdateSong = useCallback(async (song: Song) => {
    // 1. Optimistic Update in Local State
    setSongs(prev => prev.map(s => s.id === song.id ? song : s));
    
    // 2. DB Update
    const updated = await useCases.updateSong.execute(song);
    
    // 3. Sync all data
    if (updated) {
      await Promise.all([fetchLibrary(), fetchPlaylists()]);
    }
    
    return updated;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handlePatchSong = useCallback(async (songId: string, updates: Partial<Song>) => {
    // 1. Optimistic Update in Local State
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...updates } : s));
    
    // 2. DB Update
    const updated = await useCases.patchSong.execute(songId, updates);
    
    // 3. Sync all data
    if (updated) {
      await Promise.all([fetchLibrary(), fetchPlaylists()]);
    }
    
    return updated;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleDeleteSong = useCallback(async (songId: string) => {
    const res = await useCases.deleteSong.execute(songId);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleDeleteSongs = useCallback(async (songIds: string[]) => {
    const res = await useCases.deleteSongs.execute(songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleRemoveSongsFromPlaylist = useCallback(async (playlistId: string, songIds: string[]) => {
    const res = await useCases.removeSongsFromPlaylist.execute(playlistId, songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleAddSongsToPlaylist = useCallback(async (playlistId: string, songIds: string[]) => {
    const res = await useCases.addSongsToPlaylist.execute(playlistId, songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleDeletePlaylist = useCallback(async (playlistId: string) => {
    const success = await useCases.deletePlaylist.execute(playlistId);
    if (success) {
      await fetchPlaylists();
    }
    return success;
  }, [useCases, fetchPlaylists]);

  const handleScanMissingFiles = useCallback(async () => {
    return await useCases.scanMissingFiles.execute();
  }, [useCases]);

  const handleSyncLibrary = useCallback(async (options: SyncOptions = { isSilent: false }) => {
    setIsSyncing(true);
    if (onSyncStart) onSyncStart(options);
    
    try {
      // 1. Step 1 (Relink): Lấy settings và chạy Auto-import scan
      const settings = await repository.getSettings();
      const autoImportPaths = settings?.downloads?.autoImportPaths || [];
      
      const importResult = await handleRunAutoImportScan(autoImportPaths);

      // 2. Step 2 (Scan): Chạy Cleanup scan để tìm tệp thiếu
      const missing = await handleScanMissingFiles();
      setMissingSongs(missing);
      
      // 3. Hiển thị Modal nếu có tệp thiếu (Chỉ khi không phải chạy ngầm)
      if (missing.length > 0 && !options.isSilent) {
        setShowCleanupModal(true);
      }

      // 4. Callback kết quả để nền tảng hiển thị thông báo
      if (onSyncComplete) {
        onSyncComplete({
          added: importResult.added,
          migrated: importResult.migrated,
          missingCount: missing.length
        }, { setShowCleanupModal });
      }

      // 5. Ghi Log vào lịch sử (Phase 3)
      if (importResult.added > 0 || importResult.migrated > 0) {
        await repository.logSyncEvent(
          { added: importResult.added, migrated: importResult.migrated, deleted: 0 },
          importResult.details
        );
      }
    } catch (err: any) {
      console.error('[Library] Sync failed', err);
      
      if (onSyncError) {
        onSyncError(err, { setShowCleanupModal });
      }

      // Log error event
      await repository.logSyncEvent(
        { added: 0, migrated: 0, deleted: 0 },
        [`[Error] ${err.message || 'Unknown sync error'}`]
      );
    } finally {
      setIsSyncing(false);
    }
  }, [repository, handleRunAutoImportScan, handleScanMissingFiles, onSyncStart, onSyncComplete, onSyncError]);


  const handleConfirmCleanup = useCallback(async (selectedIds: string[]) => {
    if (!selectedIds.length) return false;
    
    // Thu thập chi tiết để ghi log trước khi xóa
    const deletedTitles = missingSongs
      .filter(s => selectedIds.includes(s.id))
      .map(s => s.title);

    const res = await handleDeleteSongs(selectedIds);
    if (res) {
      // Ghi Log xóa (Phase 3)
      await repository.logSyncEvent(
        { added: 0, migrated: 0, deleted: selectedIds.length },
        deletedTitles.map(t => `[Deleted] ${t}`)
      );
      
      setMissingSongs([]);
      setShowCleanupModal(false);
    }
    return res;
  }, [handleDeleteSongs, missingSongs, repository]);

  const dataValue = useMemo(() => ({
    songs,
    library,
    playlists,
    libraryVersion,
    libraryFilter,
    duplicateSongs,
    isSyncing,
    missingSongs,
    showCleanupModal,
  }), [songs, library, playlists, libraryVersion, libraryFilter, duplicateSongs, isSyncing, missingSongs, showCleanupModal]);

  const actionsValue = useMemo(() => ({
    setLibraryFilter: (f: { type: 'artist' | 'album' | 'none'; values: string[] }) => setLibraryFilter(f),
    handleImportFiles,
    handleImportFolder,
    handleAddSongs,
    clearDuplicates,
    handleCreatePlaylist,
    handleGetPlaylistDetail,
    handleUpdatePlaylist,
    handleUpdateSong,
    handlePatchSong,
    handleDeleteSong,
    handleDeleteSongs,
    handleRemoveSongsFromPlaylist,
    handleAddSongsToPlaylist,
    handleDeletePlaylist,
    refreshPlaylists: fetchPlaylists,
    refreshLibrary: fetchLibrary,
    handleScanMissingFiles,
    handleRunAutoImportScan,
    handleSyncLibrary,
    handleConfirmCleanup,
    getSyncHistory: () => repository.getSyncHistory(),
    clearSyncHistory: () => repository.clearSyncHistory(),
    logSyncEvent: (stats: SyncStats, details: string[]) => repository.logSyncEvent(stats, details),
    setShowCleanupModal,
    repository,
  }), [
    handleImportFiles, handleImportFolder, handleAddSongs, clearDuplicates,
    handleCreatePlaylist, handleGetPlaylistDetail, handleUpdatePlaylist,
    handleUpdateSong, handlePatchSong, handleDeleteSong, handleDeleteSongs,
    handleRemoveSongsFromPlaylist, handleAddSongsToPlaylist,
    handleDeletePlaylist, fetchPlaylists, fetchLibrary,
    handleScanMissingFiles, handleRunAutoImportScan, handleSyncLibrary, 
    handleConfirmCleanup, repository
  ]);

  // Phase 4: Background Sync Logic
  useEffect(() => {
    let interval: any;
    let isMounted = true;
    
    const setupSync = async () => {
      try {
        const settings = await repository.getSettings();
        if (!isMounted) return;

        // 1. Periodic Background Sync
        const intervalMinutes = settings?.downloads?.backgroundSync || 0;
        if (intervalMinutes > 0) {
          console.log(`[Library] Initializing background sync interval (${intervalMinutes}m)`);
          interval = setInterval(() => {
            console.log('[Library] Triggering periodic background sync');
            handleSyncLibrary({ isSilent: true });
          }, intervalMinutes * 60 * 1000);
        } else {
          console.log('[Library] Background sync is disabled');
        }

        // 2. Initial Startup Sync Guard (React 18 Double Mount Anti-Ghosting)
        if (isMounted && !isInitialized.current) {
          console.log('[Library] Triggering startup auto-import scan');
          handleSyncLibrary({ isSilent: true });
          isInitialized.current = true;
        }
      } catch (err) {
        if (isMounted) {
          console.error('[Library] Background sync setup failed', err);
        }
      }
    };

    setupSync();

    return () => {
      isMounted = false;
      if (interval) {
        console.log('[Library] Clearing background sync interval');
        clearInterval(interval);
      }
    };
  }, [handleSyncLibrary, repository]);

  return (
    <LibraryDataContext.Provider value={dataValue}>
      <LibraryActionsContext.Provider value={actionsValue}>
        {children}
      </LibraryActionsContext.Provider>
    </LibraryDataContext.Provider>
  );
};

