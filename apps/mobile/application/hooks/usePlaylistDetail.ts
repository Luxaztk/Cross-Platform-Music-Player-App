import { GetPlaylistByIdUseCase } from '@music/core';
import { PlaylistDetail } from '@music/types';
import { MobileLibraryRepository } from '@/infrastructure/repositories';
import { useEffect, useState } from 'react';

export const usePlaylistDetail = (id?: string) => {
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const repo = new MobileLibraryRepository();
        const usecase = new GetPlaylistByIdUseCase(repo);
        const data = await usecase.execute(id);
        setPlaylist(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { playlist, loading };
};
