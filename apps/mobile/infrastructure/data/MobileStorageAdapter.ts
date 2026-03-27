import type { IStorageAdapter } from '../../../../packages/core/src/index';
import type { Song, Playlist } from '../../../../packages/types/index';
import sampleSongs from './song.json';
import samplePlaylists from './playlist.json';

// Seed the in-memory maps
const songMap: Record<string, Song> = {};
sampleSongs.forEach((s: any) => {
  songMap[s.id] = {
    id: String(s.id),
    filePath: s.audioUrl || '',
    title: s.title || 'Unknown',
    artist: s.artist || 'Unknown',
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

export class MobileStorageAdapter implements IStorageAdapter {
  getLibrary(): Playlist {
    return currentLibrary;
  }

  getSongs(): Record<string, Song> {
    return currentSongs;
  }

  saveLibrary(library: Playlist): void {
    currentLibrary = library;
  }

  saveSongs(songs: Record<string, Song>): void {
    currentSongs = songs;
  }
}
