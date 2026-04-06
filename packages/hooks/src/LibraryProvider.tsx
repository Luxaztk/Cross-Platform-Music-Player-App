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
  type ILibraryRepository
} from '@music/core';

import type { Song, Playlist, ImportResult } from '@music/types';

interface LibraryContextType {
  songs: Song[];
  library: Playlist | null;
  playlists: Playlist[];
  libraryFilter: { type: 'artist' | 'album' | 'none'; values: string[] };
  setLibraryFilter: (filter: { type: 'artist' | 'album' | 'none'; values: string[] }) => void;
  handleImportFiles: () => Promise<ImportResult>;
  handleImportFolder: () => Promise<ImportResult>;
  handleAddSongs: (songs: Song[]) => Promise<{ success: boolean; count: number }>;
  duplicateSongs: Song[];
  clearDuplicates: () => void;
  handleCreatePlaylist: (name?: string) => Promise<Playlist | null>;
  handleGetPlaylistDetail: (id: string) => Promise<any>;
  handleUpdatePlaylist: (playlist: Playlist) => Promise<Playlist | null>;
  handleUpdateSong: (song: Song) => Promise<Song | null>;
  handleDeleteSong: (songId: string) => Promise<boolean>;
  handleDeleteSongs: (songIds: string[]) => Promise<boolean>;
  handleRemoveSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
  handleAddSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
  handleDeletePlaylist: (playlistId: string) => Promise<boolean>;
  refreshPlaylists: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

interface LibraryProviderProps {
  children: ReactNode;
  repository: ILibraryRepository;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children, repository }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [duplicateSongs, setDuplicateSongs] = useState<Song[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<{ type: 'artist' | 'album' | 'none'; values: string[] }>({ 
    type: 'none', 
    values: [] 
  });

  const getLibraryUc = new GetLibraryUseCase(repository);
  const getPlaylistsUc = new GetPlaylistsUseCase(repository);
  const importFilesUc = new ImportFilesUseCase(repository);
  const importFolderUc = new ImportFolderUseCase(repository);
  const createPlaylistUc = new CreatePlaylistUseCase(repository);
  const getPlaylistByIdUc = new GetPlaylistByIdUseCase(repository);
  const updatePlaylistUc = new UpdatePlaylistUseCase(repository);
  const updateSongUc = new UpdateSongUseCase(repository);
  const deletePlaylistUc = new DeletePlaylistUseCase(repository);

  const fetchLibrary = async () => {
    const data = await getLibraryUc.execute();
    setSongs(data.songs);
    setLibrary(data.library);
  };

  const fetchPlaylists = async () => {
    const data = await getPlaylistsUc.execute();
    setPlaylists(data);
  };

  useEffect(() => {
    fetchLibrary();
    fetchPlaylists();
  }, [repository]);

  const handleImportFiles = async () => {
    const res = await importFilesUc.execute();
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
  };

  const handleImportFolder = async () => {
    const res = await importFolderUc.execute();
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
  };

  const handleAddSongs = async (songsToAdd: Song[]) => {
    const res = await repository.addSongs(songsToAdd);
    if (res.success) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    setDuplicateSongs([]); // Clear after resolution
    return res;
  };

  const clearDuplicates = () => setDuplicateSongs([]);

  const handleCreatePlaylist = async (name: string = 'New Playlist') => {
    const newPlaylist = await createPlaylistUc.execute(name);
    await fetchPlaylists();
    return newPlaylist;
  };

  const handleGetPlaylistDetail = async (id: string) => {
    return await getPlaylistByIdUc.execute(id);
  };

  const handleUpdatePlaylist = async (playlist: Playlist) => {
    const updated = await updatePlaylistUc.execute(playlist);
    await fetchPlaylists();
    return updated;
  };

  const handleUpdateSong = async (song: Song) => {
    const updated = await updateSongUc.execute(song);
    await fetchLibrary();
    await fetchPlaylists();
    return updated;
  };

  const handleDeleteSong = async (songId: string) => {
    const res = await repository.deleteSong(songId);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  };

  const handleDeleteSongs = async (songIds: string[]) => {
    const res = await repository.deleteSongs(songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  };

  const handleRemoveSongsFromPlaylist = async (playlistId: string, songIds: string[]) => {
    const res = await repository.removeSongsFromPlaylist(playlistId, songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  };

  const handleAddSongsToPlaylist = async (playlistId: string, songIds: string[]) => {
    const res = await repository.addSongsToPlaylist(playlistId, songIds);
    if (res) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    const res = await deletePlaylistUc.execute(playlistId);
    if (res) {
      await fetchPlaylists();
    }
    return res;
  };

  return (
    <LibraryContext.Provider value={{ 
      songs, 
      library, 
      playlists, 
      libraryFilter,
      setLibraryFilter,
      handleImportFiles, 
      handleImportFolder, 
      handleAddSongs,
      duplicateSongs,
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
      refreshLibrary: fetchLibrary
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibraryContext = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibraryContext must be used within a LibraryProvider');
  }
  return context;
};
