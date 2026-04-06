import { useMemo } from 'react';
import Fuse from 'fuse.js';
import type { Song, Playlist } from '@music/types';
import { splitArtists } from '@music/utils';

export interface SearchResults {
  songs: Song[];
  playlists: Playlist[];
  albums: { id: string; name: string; artist: string; coverArt?: string }[];
  artists: { id: string; name: string; avatar?: string }[];
}

export const useSearch = (songs: Song[], playlists: Playlist[], query: string) => {
  const songFuse = useMemo(() => new Fuse(songs, {
    keys: ['title', 'artist', 'album'],
    threshold: 0.3,
    includeMatches: true,
  }), [songs]);

  const playlistFuse = useMemo(() => new Fuse(playlists, {
    keys: ['name'],
    threshold: 0.4,
    includeMatches: true,
  }), [playlists]);

  const results = useMemo((): SearchResults => {
    if (!query) return { songs: [], playlists: [], albums: [], artists: [] };

    const songResults = songFuse.search(query).map((res: { item: Song }) => res.item);
    const playlistResults = playlistFuse.search(query).map((res: { item: Playlist }) => res.item);

    // Derive unique albums from matching songs
    const albumMap = new Map<string, any>();
    songs.forEach(song => {
      if (song.album && song.album.toLowerCase().includes(query.toLowerCase())) {
        albumMap.set(song.album, { id: `album-${song.album}`, name: song.album, artist: song.artist, coverArt: song.coverArt });
      }
    });

    // Derive unique artists from matching songs
    const artistMap = new Map<string, any>();
    songs.forEach(song => {
      // Robust runtime split: handle both cases (already array vs joined string)
      // to ensure even legacy data is correctly separated.
      const individualArtists = (song.artists && song.artists.length > 0)
        ? song.artists.flatMap(a => splitArtists(a))
        : splitArtists(song.artist);
      
      individualArtists.forEach(artistName => {
        if (artistName && artistName.toLowerCase().includes(query.toLowerCase())) {
          // Option B: Don't use song cover, allow UI to handle placeholder
          artistMap.set(artistName, { id: `artist-${artistName}`, name: artistName });
        }
      });
    });

    return {
      songs: songResults.slice(0, 10), // Limit to top 10 songs
      playlists: playlistResults,
      albums: Array.from(albumMap.values()).slice(0, 5),
      artists: Array.from(artistMap.values()).slice(0, 5),
    };
  }, [songFuse, playlistFuse, query, songs]);

  return results;
};
