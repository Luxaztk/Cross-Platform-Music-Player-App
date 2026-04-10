import type { IStorageAdapter } from '../../../../packages/core/src/index';
import type { Song, Playlist, PlayerState, RecentSearch } from '../../../../packages/types/index';

import sampleSongs from './song.json';
import samplePlaylists from './playlist.json';

// Seed the in-memory maps
const songMap: Record<string, Song> = {};
(sampleSongs as RawSong[]).forEach((s) => {
  songMap[s.id] = {
    id: String(s.id),
    filePath: s.audioUrl || '',
    title: s.title || 'Unknown',
    artist: s.artist || 'Unknown',
    artists: s.artist ? [s.artist] : ['Unknown'],
    album: 'Unknown Album',
    duration: s.duration || 0,
    genre: 'Unknown Genre',
    year: null,
    coverArt: null
  };
});

const defaultLibrary: Playlist = {
  id: '0',
  name: 'Library',
  description: 'All your songs',
  songIds: Object.keys(songMap),
  createdAt: new Date().toISOString()
};

let currentLibrary = defaultLibrary;
let currentSongs = songMap;

let currentPlaylists: Record<string, Playlist> = {};
let currentPlayerState: PlayerState | null = null;
let currentRecentSearches: RecentSearch[] = [];
let currentLyricUsage: Record<string, number> = {};

interface RawSong {
  id: string;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
}

export class MobileStorageAdapter implements IStorageAdapter {
  async getLibrary(): Promise<Playlist> {
    return currentLibrary;
  }

  async getSongs(): Promise<Record<string, Song>> {
    return currentSongs;
  }

  async getPlaylists(): Promise<Record<string, Playlist>> {
    return currentPlaylists;
  }

  async saveLibrary(library: Playlist): Promise<void> {
    currentLibrary = library;
  }

  async saveSongs(songs: Record<string, Song>): Promise<void> {
    currentSongs = songs;
  }

  async savePlaylists(playlists: Record<string, Playlist>): Promise<void> {
    currentPlaylists = playlists;
  }

  async getPlayerState(): Promise<PlayerState | null> {
    return currentPlayerState;
  }

  async savePlayerState(state: PlayerState): Promise<void> {
    currentPlayerState = state;
  }

  async getRecentSearches(): Promise<RecentSearch[]> {
    return currentRecentSearches;
  }

  async saveRecentSearches(searches: RecentSearch[]): Promise<void> {
    currentRecentSearches = searches;
  }

  async getLyricUsage(): Promise<Record<string, number>> {
    return currentLyricUsage;
  }

  async saveLyricUsage(usage: Record<string, number>): Promise<void> {
    currentLyricUsage = usage;
  }

  async incrementLyricUsage(lyricId: number | string): Promise<void> {
    const idStr = lyricId.toString();
    currentLyricUsage[idStr] = (currentLyricUsage[idStr] || 0) + 1;
  }
}

