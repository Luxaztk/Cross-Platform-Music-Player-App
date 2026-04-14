import type { Song, Playlist, PlaylistDetail, ImportResult, LyricSearchResult } from '@music/types';

export interface ILibraryRepository {
  getLibrary(): Promise<{ songs: Song[]; library: Playlist }>;
  getPlaylists(): Promise<Playlist[]>;
  getPlaylistById(id: string): Promise<PlaylistDetail | null>;
  createPlaylist(name: string): Promise<Playlist>;
  updatePlaylist(playlist: Playlist): Promise<Playlist>;
  updateSong(song: Song): Promise<Song>;
  deleteSong(songId: string): Promise<boolean>;
  deleteSongs(songIds: string[]): Promise<boolean>;
  removeSongsFromPlaylist(playlistId: string, songIds: string[]): Promise<boolean>;
  addSongsToPlaylist(playlistId: string, songIds: string[]): Promise<boolean>;
  deletePlaylist(playlistId: string): Promise<boolean>;
  importFiles(): Promise<ImportResult>;
  importFolder(): Promise<ImportResult>;
  addSongs(songs: Song[]): Promise<{ success: boolean; count: number }>;
  scanMissingFiles(): Promise<string[]>;
  getLyrics(songId: string): Promise<string | null>;
  saveLyrics(songId: string, lyrics: string, lyricId?: number): Promise<boolean>;
  searchLyrics(query: string): Promise<LyricSearchResult[]>;
  patchSong(songId: string, updates: Partial<Song>): Promise<Song | null>;
}
