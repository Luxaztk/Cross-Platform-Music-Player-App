import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Song, Playlist } from '@music/types';
import { splitArtists } from '@music/utils';

export interface SearchResults {
  songs: Song[];
  playlists: Playlist[];
  albums: { id: string; name: string; artist: string; coverArt?: string | null }[];
  artists: { id: string; name: string; avatar?: string }[];
}

export const useSearch = (songs: Song[], playlists: Playlist[], query: string): SearchResults => {
  // 1. Khởi tạo Fuse cho Songs (Giữ nguyên)
  const songFuse = useMemo(() => new Fuse(songs, {
    keys: ['title', 'artist', 'album'],
    threshold: 0.3,
  }), [songs]);

  // 2. Khởi tạo Fuse cho Playlists
  const playlistFuse = useMemo(() => new Fuse(playlists, {
    keys: ['name'],
    threshold: 0.4,
  }), [playlists]);

  return useMemo(() => {
    // Trả về dữ liệu trống ngay lập tức nếu không có query
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return { songs: [], playlists: [], albums: [], artists: [] };

    // Thực hiện tìm kiếm chính
    const matchedSongs = songFuse.search(trimmedQuery);
    const matchedPlaylists = playlistFuse.search(trimmedQuery);

    // 3. Dùng mảng kết quả của Fuse để suy ra Album và Artist
    // Cách này đảm bảo tính Fuzzy (gõ gần đúng vẫn ra Album/Artist)
    const albumMap = new Map<string, SearchResults['albums'][number]>();
    const artistMap = new Map<string, SearchResults['artists'][number]>();

    matchedSongs.forEach(({ item }) => {
      // Xử lý Album
      if (item.album && !albumMap.has(item.album)) {
        albumMap.set(item.album, {
          id: `album-${item.album}`,
          name: item.album,
          artist: item.artist,
          coverArt: item.coverArt
        });
      }

      // Xử lý Artist
      const individualArtists = (item.artists && item.artists.length > 0)
        ? item.artists.flatMap(a => splitArtists(a))
        : splitArtists(item.artist);

      individualArtists.forEach(name => {
        const lowerName = name.toLowerCase();
        const lowerQuery = trimmedQuery.toLowerCase();

        // Kiểm tra xem artist này có khớp với query không 
        // (Hoặc đơn giản là lấy artist từ các bài hát đã match)
        if (lowerName.includes(lowerQuery) && !artistMap.has(lowerName)) {
          artistMap.set(lowerName, {
            id: `artist-${name}`,
            name: name
          });
        }
      });
    });

    return {
      songs: matchedSongs.map(res => res.item).slice(0, 10),
      playlists: matchedPlaylists.map(res => res.item).slice(0, 10),
      albums: Array.from(albumMap.values()).slice(0, 5),
      artists: Array.from(artistMap.values()).slice(0, 5),
    };
  }, [songFuse, playlistFuse, query]);
  // Loại bỏ 'songs' khỏi dependency vì songFuse đã bao hàm nó
};