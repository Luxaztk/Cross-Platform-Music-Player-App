import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ElectronLibraryRepository } from '../../../infrastructure/repositories';
import { GetLibraryUseCase, GetPlaylistsUseCase, ImportFilesUseCase, ImportFolderUseCase, CreatePlaylistUseCase, GetPlaylistByIdUseCase, UpdatePlaylistUseCase, UpdateSongUseCase, DeleteSongUseCase, DeletePlaylistUseCase } from '@music/core';
import type { Song, Playlist } from '@music/types';

const repo = new ElectronLibraryRepository();
const getLibraryUc = new GetLibraryUseCase(repo);
const getPlaylistsUc = new GetPlaylistsUseCase(repo);
const importFilesUc = new ImportFilesUseCase(repo);
const importFolderUc = new ImportFolderUseCase(repo);
const createPlaylistUc = new CreatePlaylistUseCase(repo);
const getPlaylistByIdUc = new GetPlaylistByIdUseCase(repo);
const updatePlaylistUc = new UpdatePlaylistUseCase(repo);
const updateSongUc = new UpdateSongUseCase(repo);
const deleteSongUc = new DeleteSongUseCase(repo);
const deletePlaylistUc = new DeletePlaylistUseCase(repo);

interface LibraryContextType {
  songs: Song[];
  library: Playlist | null;
  playlists: Playlist[];
  handleImportFiles: () => Promise<{ success: boolean; count: number }>;
  handleImportFolder: () => Promise<{ success: boolean; count: number }>;
  handleCreatePlaylist: (name?: string) => Promise<Playlist | null>;
  handleGetPlaylistDetail: (id: string) => Promise<any>;
  handleUpdatePlaylist: (playlist: Playlist) => Promise<Playlist | null>;
  handleUpdateSong: (song: Song) => Promise<Song | null>;
  handleDeleteSong: (songId: string) => Promise<boolean>;
  handleDeletePlaylist: (playlistId: string) => Promise<boolean>;
  refreshPlaylists: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

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
  }, []);

  const handleImportFiles = async () => {
    const res = await importFilesUc.execute();
    if (res.success) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  };

  const handleImportFolder = async () => {
    const res = await importFolderUc.execute();
    if (res.success) {
      await fetchLibrary();
      await fetchPlaylists();
    }
    return res;
  };

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
    const res = await deleteSongUc.execute(songId);
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
      handleImportFiles, 
      handleImportFolder, 
      handleCreatePlaylist, 
      handleGetPlaylistDetail, 
      handleUpdatePlaylist,
      handleUpdateSong,
      handleDeleteSong,
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
