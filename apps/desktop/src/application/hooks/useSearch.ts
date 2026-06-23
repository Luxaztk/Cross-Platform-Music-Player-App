import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Song, Playlist } from '@music/types';
import { splitArtists } from '@music/core';
import { normalizeText, textMatches } from '../utils/searchUtils';
import { useDebounce } from './useDebounce';

export interface SearchResults {
  songs: Song[];
  playlists: Playlist[];
  albums: { id: string; name: string; artist: string; coverArt?: string | null }[];
  artists: { id: string; name: string; avatar?: string }[];
  isSearching: boolean;
  debouncedQuery: string;
}

/**
 * Helper to safely get value from object by path (string or array).
 */
const getObjectValue = (obj: unknown, path: string | string[]): unknown => {
  if (Array.isArray(path)) {
    return path.reduce((acc: unknown, key) => (acc as Record<string, unknown>)?.[key], obj);
  }
  return (obj as Record<string, unknown>)[path];
};

export const useSearch = (songs: Song[], playlists: Playlist[], query: string, limit: number = 10): SearchResults => {
  const [debouncedQuery, isSearching] = useDebounce(query, 250);

  // 1. Khởi tạo Fuse cho Songs với logic chuẩn hóa tiếng Việt
  const songFuse = useMemo(() => new Fuse(songs, {
    keys: ['title', 'name', 'artist', 'album'],
    threshold: 0.3,
    ignoreLocation: true, // TẮT phạt vị trí, từ khóa ở đâu cũng tính điểm bằng nhau
    // Normalize data before Fuse indexes it
    getFn: (item, path) => {
      const value = getObjectValue(item, path);
      return normalizeText(Array.isArray(value) ? value.join(' ') : value as string);
    }
  }), [songs]);

  // 2. Khởi tạo Fuse cho Playlists
  const playlistFuse = useMemo(() => new Fuse(playlists, {
    keys: ['name'],
    threshold: 0.3,
    ignoreLocation: true,
    getFn: (item, path) => {
      const value = getObjectValue(item, path);
      return normalizeText(value as string);
    }
  }), [playlists]);

  return useMemo(() => {
    // 0. Nếu query rỗng, trả về kết quả rỗng ngay lập tức
    if (!query.trim()) {
      return {
        songs: [],
        playlists: [],
        albums: [],
        artists: [],
        isSearching: false,
        debouncedQuery: '',
      };
    }

    const trimmedQuery = debouncedQuery.trim();
    if (!trimmedQuery) {
      return {
        songs: [],
        playlists: [],
        albums: [],
        artists: [],
        isSearching,
        debouncedQuery
      };
    }

    // Normalize query to match normalized data for Fuse
    const normalizedQuery = normalizeText(trimmedQuery);
    
    // Thực hiện tìm kiếm + Hậu kiểm Smart Intent để cưỡng chế tính nhất quán và triệt tiêu Fuzzy Overreach
    const matchedSongs = songFuse.search(normalizedQuery)
      .filter(({ item }) => {
        const songTitle = item.title;
        const artists = splitArtists(item.artist);
        
        return textMatches(songTitle, debouncedQuery) || 
               textMatches(item.artist, debouncedQuery) || 
               artists.some(a => textMatches(a, debouncedQuery)) ||
               textMatches(item.album, debouncedQuery);
      });

    const matchedPlaylists = playlistFuse.search(normalizedQuery)
      .filter(({ item }) => textMatches(item.name, debouncedQuery));

    // 2. Phân loại kết quả từ Songs (Albums/Artists)
    const albumMap = new Map<string, { id: string; name: string; artist: string; coverArt?: string | null }>();
    const artistMap = new Map<string, { id: string; name: string; avatar?: string }>();

    matchedSongs.forEach(({ item }) => {
      // Collect albums
      if (item.album) {
        const albumKey = `${item.album}-${item.artist}`;
        if (!albumMap.has(albumKey)) {
          albumMap.set(albumKey, {
            id: `album-${item.album}-${item.artist}`,
            name: item.album,
            artist: item.artist,
            coverArt: item.coverArt
          });
        }
      }

      // Collect artists
      const artists = splitArtists(item.artist);
      artists.forEach(name => {
        const normalizedArtistName = name.toLowerCase().trim();
        if (!artistMap.has(normalizedArtistName)) {
          artistMap.set(normalizedArtistName, {
            id: `artist-${name}`,
            name: name
          });
        }
      });
    });

    return {
      songs: matchedSongs.map(res => res.item).slice(0, limit),
      playlists: matchedPlaylists.map(res => res.item).slice(0, limit),
      albums: Array.from(albumMap.values()).slice(0, 5),
      artists: Array.from(artistMap.values()).slice(0, 5),
      isSearching,
      debouncedQuery
    };
  }, [songFuse, playlistFuse, query, debouncedQuery, isSearching, limit]);
};