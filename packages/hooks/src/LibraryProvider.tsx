import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  GetLibraryUseCase, 
  GetPlaylistsUseCase, 
  ImportFilesUseCase, 
  ImportFolderUseCase, 
  CreatePlaylistUseCase, 
  GetPlaylistByIdUseCase, 
  UpdatePlaylistUseCase, 
  UpdateSongUseCase, 
  DeletePlaylistUseCase,
  DeleteSongUseCase,
  DeleteSongsUseCase,
  AddSongsToPlaylistUseCase,
  RemoveSongsFromPlaylistUseCase,
  ScanMissingFilesUseCase,
  type ILibraryRepository
} from '@music/core';

import type { Song, Playlist, ImportResult, PlaylistDetail, DuplicateSongInfo } from '@music/types';

interface LibraryDataContextType {
  songs: Song[];
  library: Playlist | null;
  playlists: Playlist[];
  duplicateSongs: DuplicateSongInfo[];
  libraryVersion: number;
  libraryFilter: { type: 'artist' | 'album' | 'none'; values: string[] };
}

interface LibraryActionsContextType {
  setLibraryFilter: (filter: { type: 'artist' | 'album' | 'none'; values: string[] }) => void;
  handleImportFiles: () => Promise<ImportResult>;
  handleImportFolder: () => Promise<ImportResult>;
  handleAddSongs: (songs: Song[]) => Promise<{ success: boolean; count: number }>;
  clearDuplicates: () => void;
  handleCreatePlaylist: (name?: string) => Promise<Playlist | null>;
  handleGetPlaylistDetail: (id: string) => Promise<PlaylistDetail | null>;
  handleUpdatePlaylist: (playlist: Playlist) => Promise<Playlist | null>;
  handleUpdateSong: (song: Song) => Promise<Song | null>;
  handleDeleteSong: (songId: string) => Promise<boolean>;
  handleDeleteSongs: (songIds: string[]) => Promise<boolean>;
  handleRemoveSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
  handleAddSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
  handleDeletePlaylist: (playlistId: string) => Promise<boolean>;
  refreshPlaylists: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  handleScanMissingFiles: () => Promise<string[]>;
  repository: ILibraryRepository;
}

const LibraryDataContext = createContext<LibraryDataContextType | undefined>(undefined);
const LibraryActionsContext = createContext<LibraryActionsContextType | undefined>(undefined);

interface LibraryProviderProps {
  children: ReactNode;
  repository: ILibraryRepository;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children, repository }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [duplicateSongs, setDuplicateSongs] = useState<DuplicateSongInfo[]>([]);
  const [libraryVersion, setLibraryVersion] = useState(0);
  const [libraryFilter, setLibraryFilter] = useState<{ type: 'artist' | 'album' | 'none'; values: string[] }>({ 
    type: 'none', 
    values: [] 
  });

  // Memoize UseCases to keep them stable
  const useCases = React.useMemo(() => ({
    getLibrary: new GetLibraryUseCase(repository),
    getPlaylists: new GetPlaylistsUseCase(repository),
    importFiles: new ImportFilesUseCase(repository),
    importFolder: new ImportFolderUseCase(repository),
    createPlaylist: new CreatePlaylistUseCase(repository),
    getPlaylistById: new GetPlaylistByIdUseCase(repository),
    updatePlaylist: new UpdatePlaylistUseCase(repository),
    updateSong: new UpdateSongUseCase(repository),
    deletePlaylist: new DeletePlaylistUseCase(repository),
    deleteSong: new DeleteSongUseCase(repository),
    deleteSongs: new DeleteSongsUseCase(repository),
    addSongsToPlaylist: new AddSongsToPlaylistUseCase(repository),
    removeSongsFromPlaylist: new RemoveSongsFromPlaylistUseCase(repository),
    scanMissingFiles: new ScanMissingFilesUseCase(repository),
  }), [repository]);

  const fetchLibrary = React.useCallback(async () => {
    const data = await useCases.getLibrary.execute();
    setSongs(data.songs);
    setLibrary(data.library);
    setLibraryVersion(v => v + 1);
  }, [useCases]);

  const fetchPlaylists = React.useCallback(async () => {
    const data = await useCases.getPlaylists.execute();
    setPlaylists(data);
    setLibraryVersion(v => v + 1);
  }, [useCases]);

  useEffect(() => {
    fetchLibrary();
    fetchPlaylists();
  }, [fetchLibrary, fetchPlaylists]);

  const handleImportFiles = React.useCallback(async () => {
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

  const handleImportFolder = React.useCallback(async () => {
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

  const handleAddSongs = React.useCallback(async (songsToAdd: Song[]) => {
    const res = await repository.addSongs(songsToAdd);
    if (res.success) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    setDuplicateSongs([]); // Clear after resolution
    return res;
  }, [repository, fetchLibrary, fetchPlaylists]);

  const clearDuplicates = React.useCallback(() => setDuplicateSongs([]), []);

  const handleCreatePlaylist = React.useCallback(async (name: string = 'New Playlist') => {
    const newPlaylist = await useCases.createPlaylist.execute(name);
    await fetchPlaylists();
    return newPlaylist;
  }, [useCases, fetchPlaylists]);

  const handleGetPlaylistDetail = React.useCallback(async (id: string) => {
    return await useCases.getPlaylistById.execute(id);
  }, [useCases]);

  const handleUpdatePlaylist = React.useCallback(async (p: Playlist) => {
    const updated = await useCases.updatePlaylist.execute(p);
    await fetchPlaylists();
    return updated;
  }, [useCases, fetchPlaylists]);

  const handleUpdateSong = React.useCallback(async (song: Song) => {
    // 1. Optimistic Update in Local State
    setSongs(prev => prev.map(s => s.id === song.id ? song : s));
    
    // 2. DB Update in Background
    const updated = await useCases.updateSong.execute(song);
    
    // 3. Update related data quietly
    fetchPlaylists(); // Small set, usually fast
    
    return updated;
  }, [useCases, fetchPlaylists]);

  const handleDeleteSong = React.useCallback(async (songId: string) => {
    const res = await useCases.deleteSong.execute(songId);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleDeleteSongs = React.useCallback(async (songIds: string[]) => {
    const res = await useCases.deleteSongs.execute(songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleRemoveSongsFromPlaylist = React.useCallback(async (playlistId: string, songIds: string[]) => {
    const res = await useCases.removeSongsFromPlaylist.execute(playlistId, songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleAddSongsToPlaylist = React.useCallback(async (playlistId: string, songIds: string[]) => {
    const res = await useCases.addSongsToPlaylist.execute(playlistId, songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  }, [useCases, fetchLibrary, fetchPlaylists]);

  const handleDeletePlaylist = React.useCallback(async (playlistId: string) => {
    const success = await useCases.deletePlaylist.execute(playlistId);
    if (success) {
      await fetchPlaylists();
    }
    return success;
  }, [useCases, fetchPlaylists]);

  const handleScanMissingFiles = React.useCallback(async () => {
    return await useCases.scanMissingFiles.execute();
  }, [useCases]);

  const dataValue = React.useMemo(() => ({
    songs,
    library,
    playlists,
    libraryVersion,
    libraryFilter,
    duplicateSongs,
  }), [songs, library, playlists, libraryVersion, libraryFilter, duplicateSongs]);

  const actionsValue = React.useMemo(() => ({
    setLibraryFilter: (f: { type: 'artist' | 'album' | 'none'; values: string[] }) => setLibraryFilter(f),
    handleImportFiles,
    handleImportFolder,
    handleAddSongs,
    clearDuplicates,
    handleCreatePlaylist,
    handleGetPlaylistDetail,
    handleUpdatePlaylist,
    handleUpdateSong,
    handleDeleteSong,
    handleDeleteSongs,
    handleRemoveSongsFromPlaylist,
    handleAddSongsToPlaylist,
    handleDeletePlaylist,
    refreshPlaylists: fetchPlaylists,
    refreshLibrary: fetchLibrary,
    handleScanMissingFiles,
    repository,
  }), [
    handleImportFiles, handleImportFolder, handleAddSongs, clearDuplicates,
    handleCreatePlaylist, handleGetPlaylistDetail, handleUpdatePlaylist,
    handleUpdateSong, handleDeleteSong, handleDeleteSongs,
    handleRemoveSongsFromPlaylist, handleAddSongsToPlaylist,
    handleDeletePlaylist, fetchPlaylists, fetchLibrary,
    handleScanMissingFiles, repository
  ]);

  return (
    <LibraryDataContext.Provider value={dataValue}>
      <LibraryActionsContext.Provider value={actionsValue}>
        {children}
      </LibraryActionsContext.Provider>
    </LibraryDataContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryDataContext);
  const actions = useContext(LibraryActionsContext);
  if (context === undefined || actions === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return { ...context, ...actions };
};

export const useLibraryContext = useLibrary;

export const useLibraryActions = () => {
  const actions = useContext(LibraryActionsContext);
  if (actions === undefined) {
    throw new Error('useLibraryActions must be used within a LibraryProvider');
  }
  return actions;
};
