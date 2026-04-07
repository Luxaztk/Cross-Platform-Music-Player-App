import type { Song, Playlist, PlaylistDetail, ImportResult, PlayerState, RecentSearch } from '@music/types';

declare global {
  interface Window {
    electronAPI: {
      // Library operations
      getLibrary: () => Promise<{ songs: Song[], library: Playlist }>;
      getPlaylists: () => Promise<Playlist[]>;
      createPlaylist: (name: string) => Promise<Playlist>;
      updatePlaylist: (playlist: Playlist) => Promise<Playlist>;
      updateSong: (song: Song) => Promise<Song>;
      deleteSong: (songId: string) => Promise<boolean>;
      deleteSongs: (songIds: string[]) => Promise<boolean>;
      removeSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
      addSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
      deletePlaylist: (playlistId: string) => Promise<boolean>;
      importFiles: () => Promise<ImportResult>;
      importFolder: () => Promise<ImportResult>;
      addSongs: (songs: Song[]) => Promise<{ success: boolean; count: number }>;
      pickImage: () => Promise<string | null>;

      // Storage operations
      getLibraryData: () => Promise<Playlist>;
      getSongsData: () => Promise<Record<string, Song>>;
      getPlaylistsData: () => Promise<Record<string, Playlist>>;
      saveSongsData: (songs: Record<string, Song>) => Promise<void>;
      saveLibraryData: (library: Playlist) => Promise<void>;
      savePlaylistsData: (playlists: Record<string, Playlist>) => Promise<void>;
      getPlayerState: () => Promise<PlayerState | null>;
      savePlayerState: (state: PlayerState) => Promise<void>;
      getRecentSearches: () => Promise<RecentSearch[]>;
      saveRecentSearches: (searches: RecentSearch[]) => Promise<void>;
    }
  }
}

export {};
