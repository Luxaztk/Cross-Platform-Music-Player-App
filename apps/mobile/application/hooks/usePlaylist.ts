import { useEffect, useState } from 'react';
import { Playlist } from '@music/types';
import { MobileLibraryRepository } from '../../infrastructure/repositories';
import { GetPlaylistsUseCase, CreatePlaylistUseCase } from '@music/core';

export const usePlaylist = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const repo = new MobileLibraryRepository(null); // Assuming null or valid storage
  const getPlaylistsUc = new GetPlaylistsUseCase(repo);
  const createPlaylistUc = new CreatePlaylistUseCase(repo);

  const fetchPlaylists = async () => {
    const data = await getPlaylistsUc.execute();
    setPlaylists(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (name: string) => {
    const newPlaylist = await createPlaylistUc.execute(name);
    await fetchPlaylists();
    return newPlaylist;
  };

  return { playlists, loading, handleCreatePlaylist };
};
