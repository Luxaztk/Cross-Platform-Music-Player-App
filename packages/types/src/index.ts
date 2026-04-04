export interface Song {
  id: string; // UUID generated on import
  filePath: string; // absolute path to local file
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  genre: string;
  year: number | null;
  coverArt: string | null; // base64 data URL
  lyrics?: string; // embedded USLT tag from ID3
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
