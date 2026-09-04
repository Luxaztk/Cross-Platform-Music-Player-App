import type {
  Song,
  Playlist,
  ImportResult,
  PlayerState,
  RecentSearch,
  LyricSearchResult,
  YoutubeInfo,
  SyncHistoryEntry,
  SyncStats,
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
      scanMissingFiles: () => Promise<Song[]>
      runAutoImportScan: (
        paths: string[],
      ) => Promise<{ added: number; migrated: number; totalScanned: number; details: string[]; inputFoldersCount: number; inputFilesCount: number }>
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
      fetchPlaylistInfo: (
        url: string,
      ) => Promise<{ success: boolean; title?: string; items?: YoutubeInfo[]; error?: string }>
      downloadYtAudio: (
        id: string,
        url: string,
        title: string,
      ) => Promise<{ success: boolean; filePath?: string; error?: string }>
      cancelDownload: (id: string) => Promise<void>
      writeAudioMetadata: (
        filePath: string,
        metadata: Partial<Song>,
      ) => Promise<{ success: boolean; error?: string }>
      onDownloadProgress: (callback: (data: { id: string; percent: number }) => void) => () => void
      onImportProgress: (callback: (percent: number) => void) => () => void
      openItemPath: (filePath: string) => Promise<void>
      openDownloadsFolder: () => Promise<void>
      deleteFile: (filePath: string) => Promise<{ success: boolean }>
      getSettings: () => Promise<unknown>
      saveSettings: (settings: unknown) => Promise<void>
      selectDirectory: (title?: string) => Promise<string | null>
      incrementLyricUsage: (id: string | number) => Promise<void>
      patchSong: (songId: string, updates: Partial<Song>) => Promise<Song | null>
      // Autoupdate
      onUpdateAvailable: (callback: (version: string) => void) => () => void
      onUpdateProgress: (callback: (percent: number) => void) => () => void
      onUpdateDownloaded: (callback: () => void) => () => void
      onUpdateNotAvailable: (callback: () => void) => () => void
      onUpdateError: (callback: (error: string) => void) => () => void
      restartApp: () => Promise<void>
      checkForUpdatesManual: () => Promise<void>
      resetCache: () => Promise<{ success: boolean; message?: string }>
      getSyncHistory: () => Promise<SyncHistoryEntry[]>
      clearSyncHistory: () => Promise<void>
      logSyncEvent: (stats: SyncStats, details: string[]) => Promise<void>

      // YouTube Authentication (Flow 2 bước & Import File)
      openYoutubeAuth: () => Promise<boolean>
      openYoutubeBrowser: () => Promise<{ opened: boolean; error?: string }>
      extractYoutubeCookies: (browserHint?: string) => Promise<{ success: boolean; browser?: string; error?: string; needManualImport?: boolean }>
      importYoutubeCookiesFile: () => Promise<{ success: boolean; error?: string }>
      logoutYoutube: () => Promise<void>
      getYoutubeAuthStatus: () => Promise<boolean>
      onYoutubeAuthRequired: (callback: (data: { url: string; id?: string }) => void) => () => void
      getPathForFile: (file: File) => string
      quitApp: () => Promise<void>

      // Server operations
      uploadSongToServer: (payload: {
        serverUrl: string
        song: Song
      }) => Promise<{ success: boolean; skipped?: boolean; song?: Song; error?: string }>
      onUploadProgress: (
        callback: (data: { speedMb: number; progress?: number }) => void,
      ) => () => void
    }
  }

  const __APP_VERSION__: string;
}

export {}
