import { Playlist, PlaylistDetail, Song, ImportResult } from '@music/types';
import { ILibraryRepository } from '@music/core';
import playlists from '@/infrastructure/data/playlist.json';
import songs from '@/infrastructure/data/song.json';

const customPlaylists: Playlist[] = [];

export class MobileLibraryRepository implements ILibraryRepository {
  async getLibrary(): Promise<{ songs: Song[], library: Playlist }> {
    const defaultLibrary: Playlist = {
      id: '0',
      name: 'Library',
      description: 'All your songs',
      songIds: songs.map(s => String(s.id)),
      createdAt: new Date().toISOString()
    };
    
    // Map to valid Song type
    const typedSongs: Song[] = songs.map(s => ({
      id: String(s.id),
      title: s.title || 'Unknown',
      artist: s.artist || 'Unknown',
      album: 'Unknown Album',
      duration: s.duration || 0,
      genre: 'Unknown Genre',
      year: null,
      coverArt: null,
      filePath: s.audioUrl || ''
    }));

    return { songs: typedSongs, library: defaultLibrary };
  }

  async getPlaylists(): Promise<Playlist[]> {
    const defaultPlaylists = playlists.map((p) => ({
      ...p,
      name: p.title,
      songCount: p.songIds.length,
    }));
    return [...defaultPlaylists, ...customPlaylists];
  }

  async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return null;

    const playlistSongs = songs.filter((song) => playlist.songIds.includes(String(song.id)));
    
    // Convert to proper types
    const typedSongs: Song[] = playlistSongs.map(s => ({
      id: String(s.id),
      title: s.title || 'Unknown',
      artist: s.artist || 'Unknown',
      album: 'Unknown Album',
      duration: s.duration || 0,
      genre: 'Unknown Genre',
      year: null,
      coverArt: null,
      filePath: s.audioUrl || ''
    }));

    return { 
      ...playlist,
      name: playlist.title,
      songs: typedSongs, 
      songCount: playlist.songIds.length 
    };
  }

  async importFiles(): Promise<ImportResult> {
    throw new Error('Not implemented on mobile sample yet');
  }

  async importFolder(): Promise<ImportResult> {
    throw new Error('Not implemented on mobile sample yet');
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      description: '',
      songIds: [],
      createdAt: new Date().toISOString()
    };
    customPlaylists.push(newPlaylist);
    return newPlaylist;
  }
}
