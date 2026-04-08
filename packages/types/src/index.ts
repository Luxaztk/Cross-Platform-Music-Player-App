export interface Song {
  id: string; // UUID generated on import
  filePath: string; // absolute path to local file
  title: string;
  artist: string; // Original joined string
  artists: string[]; // Separated artist list
  album: string;
  duration: number; // seconds
  genre: string;
  year: number | null;
  coverArt: string | null; // base64 data URL
  lyrics?: string; // embedded USLT tag from ID3 (legacy/unsynced)
  syncedLyrics?: string; // embedded SYLT tag from ID3 (LRC format)
  hash?: string; // Content hash for de-duplication
  fileSize?: number; // Size in bytes
  sourceUrl?: string; // YouTube URL or similar
  originId?: string; // YouTube Video ID or similar
  lyricId?: number; // LRCLIB lyric ID
}

export interface LyricSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  syncedLyrics: string;
  plainLyrics: string;
}

export interface Playlist {
  id: string; // "0" is reserved for the Library
  name: string; // "Library" for the master list
  description: string;
  songIds: string[];
  thumbnail?: string; // Base64 or local URI
  createdAt: string;
}

export interface ImportResult {
  success: boolean;
  count: number;
  songs?: Song[];
  duplicates?: string[];
  duplicateSongs?: Song[]; // Full song objects for resolution
  reason?: 'CANCELED' | 'ERROR';
  message?: string;
  totalAttempted?: number;
}

export interface PlaylistDetail extends Playlist {
  songs: Song[];
  songCount: number;
}

export interface PlayerState {
  currentSongId: string | null;
  queueIds: string[];
  historyIds: string[];
  originalContextIds: string[];
  volume: number;
  repeatMode: 'OFF' | 'ALL' | 'ONE';
  isShuffle: boolean;
}

export type RecentSearch = 
  | { type: 'query'; text: string; timestamp: number }
  | { type: 'entity'; entityType: 'artist' | 'album'; id: string; name: string; timestamp: number };

export type RecentSearchInput = 
  | { type: 'query'; text: string }
  | { type: 'entity'; entityType: 'artist' | 'album'; id: string; name: string };
