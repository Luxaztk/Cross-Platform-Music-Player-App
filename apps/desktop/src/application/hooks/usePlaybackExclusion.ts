import { useCallback, useMemo } from 'react';
import type { Song } from '@music/types';
import { isSongExcludedFromDefault, buildExclusionIndex } from '@music/utils';
import { useSettings } from './useSettings';

export interface UsePlaybackExclusionReturn {
  isSongExcluded: (song: Song) => boolean;
  isAlbumExcluded: (albumName: string) => boolean;
  isPlaylistExcluded: (playlistId: string) => boolean;
  toggleExcludeSong: (song: Song) => Promise<void>;
  toggleExcludeAlbum: (albumName: string) => Promise<void>;
  toggleExcludePlaylist: (playlistId: string) => Promise<void>;
  excludedSongIds: string[];
  excludedAlbums: string[];
  excludedPlaylists: string[];
}

export const usePlaybackExclusion = (): UsePlaybackExclusionReturn => {
  const { settings, updateSettings } = useSettings();

  const playback = settings?.playback || {
    excludedSongIds: [],
    excludedAlbums: [],
    excludedPlaylists: [],
  };

  const exclusionIndex = useMemo(() => buildExclusionIndex(playback), [playback]);

  const isSongExcluded = useCallback(
    (song: Song): boolean => isSongExcludedFromDefault(song, exclusionIndex),
    [exclusionIndex]
  );

  const isAlbumExcluded = useCallback(
    (albumName: string): boolean => {
      if (!albumName) return false;
      return exclusionIndex.albums.has(albumName.toLowerCase().trim());
    },
    [exclusionIndex]
  );

  const isPlaylistExcluded = useCallback(
    (playlistId: string): boolean => {
      if (!playlistId) return false;
      return exclusionIndex.playlists.has(playlistId);
    },
    [exclusionIndex]
  );

  const toggleExcludeSong = useCallback(
    async (song: Song) => {
      if (!song?.id) return;
      const currentIds = playback.excludedSongIds || [];
      const isCurrentlyExcluded = currentIds.includes(song.id);
      const nextIds = isCurrentlyExcluded
        ? currentIds.filter((id) => id !== song.id)
        : [...currentIds, song.id];

      await updateSettings({
        playback: {
          ...playback,
          excludedSongIds: nextIds,
        },
      });
    },
    [playback, updateSettings]
  );

  const toggleExcludeAlbum = useCallback(
    async (albumName: string) => {
      if (!albumName) return;
      const norm = albumName.trim();
      const currentAlbums = playback.excludedAlbums || [];
      const isCurrentlyExcluded = currentAlbums.some(
        (a) => a.toLowerCase().trim() === norm.toLowerCase()
      );
      const nextAlbums = isCurrentlyExcluded
        ? currentAlbums.filter((a) => a.toLowerCase().trim() !== norm.toLowerCase())
        : [...currentAlbums, norm];

      await updateSettings({
        playback: {
          ...playback,
          excludedAlbums: nextAlbums,
        },
      });
    },
    [playback, updateSettings]
  );

  const toggleExcludePlaylist = useCallback(
    async (playlistId: string) => {
      if (!playlistId) return;
      const currentPlaylists = playback.excludedPlaylists || [];
      const isCurrentlyExcluded = currentPlaylists.includes(playlistId);
      const nextPlaylists = isCurrentlyExcluded
        ? currentPlaylists.filter((id) => id !== playlistId)
        : [...currentPlaylists, playlistId];

      await updateSettings({
        playback: {
          ...playback,
          excludedPlaylists: nextPlaylists,
        },
      });
    },
    [playback, updateSettings]
  );

  return {
    isSongExcluded,
    isAlbumExcluded,
    isPlaylistExcluded,
    toggleExcludeSong,
    toggleExcludeAlbum,
    toggleExcludePlaylist,
    excludedSongIds: playback.excludedSongIds || [],
    excludedAlbums: playback.excludedAlbums || [],
    excludedPlaylists: playback.excludedPlaylists || [],
  };
};
