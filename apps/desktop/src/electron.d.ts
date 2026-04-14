import type {
  Song,
  Playlist,
  ImportResult,
  PlayerState,
  RecentSearch,
  LyricSearchResult,
  YoutubeInfo, // Đảm bảo đã export từ Downloader hoặc types
} from '@music/types'

declare global {
  interface Window {
    electronAPI: {
      // --- Library Operations ---
      getLibrary: () => Promise<{ songs: Song[]; library: Playlist }>
      getPlaylists: () => Promise<Playlist[]>
      createPlaylist: (name: string) => Promise<Playlist>
      updatePlaylist: (playlist: Playlist) => Promise<Playlist>
      updateSong: (song: Song) => Promise<Song>
      deleteSong: (songId: string) => Promise<boolean>
      deleteSongs: (songIds: string[]) => Promise<boolean>
      removeSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>
      addSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>
      deletePlaylist: (playlistId: string) => Promise<boolean>
      importFiles: () => Promise<ImportResult>
      importFolder: () => Promise<ImportResult>
      addSongs: (songs: Song[]) => Promise<{ success: boolean; count: number }>
      importFromPath: (
        filePath: string,
        sourceUrl?: string,
        originId?: string,
      ) => Promise<ImportResult>
      checkDuplicate: (
        title: string,
        artist: string,
        url?: string,
        id?: string,
      ) => Promise<{
        isDuplicate: boolean
        reason?: 'URL' | 'METADATA' | 'HASH' // Thêm HASH cho đồng bộ Main
        existingSong: { id: string; title: string; artist: string } | null
      }>
      scanMissingFiles: () => Promise<string[]>
      getLyrics: (songId: string) => Promise<string | null>
      saveLyrics: (songId: string, lyrics: string, lyricId?: number) => Promise<boolean>
      searchLyrics: (query: string) => Promise<LyricSearchResult[]>
      pickImage: () => Promise<string | null>

      // --- Storage Operations ---
      getLibraryData: () => Promise<Playlist>
      getSongsData: () => Promise<Record<string, Song>>
      getPlaylistsData: () => Promise<Record<string, Playlist>>
      saveSongsData: (songs: Record<string, Song>) => Promise<void>
      saveLibraryData: (library: Playlist) => Promise<void>
      savePlaylistsData: (playlists: Record<string, Playlist>) => Promise<void>
      getPlayerState: () => Promise<PlayerState | null>
      savePlayerState: (state: PlayerState) => Promise<void>
      getRecentSearches: () => Promise<RecentSearch[]>
      saveRecentSearches: (searches: RecentSearch[]) => Promise<void>
      getLyricUsage: () => Promise<Record<string, number>>
      saveLyricUsage: (usage: Record<string, number>) => Promise<void>

      fetchYtInfo: (
        url: string,
      ) => Promise<{ success: boolean; info?: YoutubeInfo; error?: string }>
      downloadYtAudio: (
        url: string,
        title: string,
      ) => Promise<{ success: boolean; filePath?: string; error?: string }>
      writeAudioMetadata: (
        filePath: string,
        metadata: Partial<Song>,
      ) => Promise<{ success: boolean; error?: string }>
      onDownloadProgress: (callback: (data: { url: string; percent: number }) => void) => () => void
      openItemPath: (filePath: string) => Promise<void>
      deleteFile: (filePath: string) => Promise<{ success: boolean }>
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<void>
      selectDirectory: (title?: string) => Promise<string | null>
      incrementLyricUsage: (id: string | number) => Promise<void>
      patchSong: (songId: string, updates: Partial<Song>) => Promise<Song | null>
    }
  }
}

export {}
