import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type {
  Song,
  Playlist,
  PlayerState,
  RecentSearch,
  LyricSearchResult,
  ImportResult,
  SyncHistoryEntry,
  SyncStats,
} from '@music/types'
import type { YoutubeInfo } from './modules/downloader/YoutubeDownloader'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  reason: 'URL' | 'METADATA' | 'HASH' | null
  existingSong: { id: string; title: string; artist: string } | null
}

export interface ElectronAPI {
  importFiles: () => Promise<ImportResult>
  importFolder: () => Promise<ImportResult>
  getLibrary: () => Promise<{ songs: Song[]; library: Playlist }>
  getPlaylists: () => Promise<Playlist[]>
  createPlaylist: (name: string) => Promise<Playlist>
  updatePlaylist: (playlist: Partial<Playlist>) => Promise<void>
  updateSong: (song: Partial<Song>) => Promise<void>
  deleteSong: (songId: string) => Promise<void>
  deleteSongs: (songIds: string[]) => Promise<void>
  removeSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<void>
  addSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>
  deletePlaylist: (playlistId: string) => Promise<void>
  pickImage: () => Promise<string | null>
  addSongs: (songs: Partial<Song>[]) => Promise<void>
  importFromPath: (filePath: string, sourceUrl?: string, originId?: string) => Promise<void>
  checkDuplicate: (
    title: string,
    artist: string,
    url?: string,
    id?: string,
  ) => Promise<DuplicateCheckResult>
  scanMissingFiles: () => Promise<void>
  runAutoImportScan: (paths: string[]) => Promise<{ added: number; migrated: number; totalScanned: number; details: string[]; inputFoldersCount: number; inputFilesCount: number }>
  getLyrics: (songId: string) => Promise<string | null>
  saveLyrics: (songId: string, lyrics: string, lyricId?: number) => Promise<void>
  searchLyrics: (query: string) => Promise<LyricSearchResult[]>
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
  incrementLyricUsage: (id: number | string) => Promise<void>
  patchSong: (songId: string, updates: Partial<Song>) => Promise<Song | null>
  fetchYtInfo: (url: string) => Promise<{ success: boolean; info?: YoutubeInfo; error?: string }>
  fetchPlaylistInfo: (url: string) => Promise<{ success: boolean; items?: YoutubeInfo[]; error?: string }>
  downloadYtAudio: (
    id: string,
    url: string,
    title: string,
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>
  writeAudioMetadata: (filePath: string, metadata: Partial<Song>) => Promise<void>
  onDownloadProgress: (callback: (data: { id: string; percent: number }) => void) => () => void
  onImportProgress: (callback: (percent: number) => void) => () => void
  openItemPath: (filePath: string) => Promise<void>
  openDownloadsFolder: () => Promise<void>
  deleteFile: (filePath: string) => Promise<void>
  getSettings: () => Promise<unknown>
  saveSettings: (settings: unknown) => Promise<void>
  selectDirectory: (title?: string) => Promise<string | null>
  resetCache: () => Promise<{ success: boolean; message?: string }>

  // Các hàm Auto Update mới thêm vào
  onUpdateAvailable: (callback: (version: string) => void) => () => void
  onUpdateProgress: (callback: (percent: number) => void) => () => void
  onUpdateDownloaded: (callback: () => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void
  onUpdateError: (callback: (error: string) => void) => () => void
  restartApp: () => Promise<void>
  checkForUpdatesManual: () => Promise<void>
  log: (level: string, message: string) => void
  getSyncHistory: () => Promise<SyncHistoryEntry[]>
  clearSyncHistory: () => Promise<void>
  logSyncEvent: (stats: SyncStats, details: string[]) => Promise<void>
  
  // YouTube Authentication (Flow 2 bước)
  openYoutubeAuth: () => Promise<boolean>
  openYoutubeBrowser: () => Promise<{ opened: boolean; error?: string }>
  extractYoutubeCookies: (browserHint?: string) => Promise<{ success: boolean; browser?: string; error?: string; needManualImport?: boolean }>
  importYoutubeCookiesFile: () => Promise<{ success: boolean; error?: string }>
  logoutYoutube: () => Promise<void>
  getYoutubeAuthStatus: () => Promise<boolean>
  onYoutubeAuthRequired: (callback: (data: { url: string; id?: string }) => void) => () => void
  getPathForFile: (file: File) => string
  quitApp: () => Promise<void>
}

// Expose safe APIs to the renderer process
const electronAPI: ElectronAPI = {
  importFiles: () => ipcRenderer.invoke('library:importFiles'),
  importFolder: () => ipcRenderer.invoke('library:importFolder'),
  getLibrary: () => ipcRenderer.invoke('library:get'),
  getPlaylists: () => ipcRenderer.invoke('library:getPlaylists'),
  createPlaylist: (name: string) => ipcRenderer.invoke('library:createPlaylist', name),
  updatePlaylist: (playlist: Partial<Playlist>) =>
    ipcRenderer.invoke('library:updatePlaylist', playlist),
  updateSong: (song: Partial<Song>) => ipcRenderer.invoke('library:updateSong', song),
  deleteSong: (songId: string) => ipcRenderer.invoke('library:deleteSong', songId),
  deleteSongs: (songIds: string[]) => ipcRenderer.invoke('library:deleteSongs', songIds),
  removeSongsFromPlaylist: (playlistId: string, songIds: string[]) =>
    ipcRenderer.invoke('library:removeSongsFromPlaylist', playlistId, songIds),
  addSongsToPlaylist: (playlistId: string, songIds: string[]) =>
    ipcRenderer.invoke('library:addSongsToPlaylist', playlistId, songIds),
  deletePlaylist: (playlistId: string) => ipcRenderer.invoke('library:deletePlaylist', playlistId),
  pickImage: () => ipcRenderer.invoke('library:pickImage'),
  addSongs: (songs: Partial<Song>[]) => ipcRenderer.invoke('library:addSongs', songs),
  importFromPath: (filePath: string, sourceUrl?: string, originId?: string) =>
    ipcRenderer.invoke('library:importFromPath', filePath, sourceUrl, originId),
  checkDuplicate: (title: string, artist: string, url?: string, id?: string) =>
    ipcRenderer.invoke('library:checkDuplicate', title, artist, url, id),
  scanMissingFiles: () => ipcRenderer.invoke('library:scanMissingFiles'),
  runAutoImportScan: (paths: string[]) => ipcRenderer.invoke('library:runAutoImportScan', paths),
  getLyrics: (songId: string) => ipcRenderer.invoke('library:getLyrics', songId),
  saveLyrics: (songId: string, lyrics: string, lyricId?: number) =>
    ipcRenderer.invoke('library:saveLyrics', songId, lyrics, lyricId),
  searchLyrics: (query: string) => ipcRenderer.invoke('library:searchLyrics', query),

  // Storage operations
  getLibraryData: () => ipcRenderer.invoke('storage:getLibrary'),
  getSongsData: () => ipcRenderer.invoke('storage:getSongs'),
  getPlaylistsData: () => ipcRenderer.invoke('storage:getPlaylists'),
  saveSongsData: (songs: Record<string, Song>) => ipcRenderer.invoke('storage:saveSongs', songs),
  saveLibraryData: (library: Playlist) => ipcRenderer.invoke('storage:saveLibrary', library),
  savePlaylistsData: (playlists: Record<string, Playlist>) =>
    ipcRenderer.invoke('storage:savePlaylists', playlists),
  getPlayerState: () => ipcRenderer.invoke('storage:getPlayerState'),
  savePlayerState: (state: PlayerState) => ipcRenderer.invoke('storage:savePlayerState', state),
  getRecentSearches: () => ipcRenderer.invoke('storage:getRecentSearches'),
  saveRecentSearches: (searches: RecentSearch[]) =>
    ipcRenderer.invoke('storage:saveRecentSearches', searches),
  getLyricUsage: () => ipcRenderer.invoke('storage:getLyricUsage'),
  saveLyricUsage: (usage: Record<string, number>) =>
    ipcRenderer.invoke('storage:saveLyricUsage', usage),
  incrementLyricUsage: (id: number | string) =>
    ipcRenderer.invoke('storage:incrementLyricUsage', id),
  patchSong: (songId: string, updates: Partial<Song>) =>
    ipcRenderer.invoke('storage:patchSong', songId, updates),
  getSettings: () => ipcRenderer.invoke('storage:getSettings'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('storage:saveSettings', settings),
  selectDirectory: (title?: string) => ipcRenderer.invoke('dialog:openDirectory', title),

  // Downloader operations
  fetchYtInfo: (url: string) => ipcRenderer.invoke('fetch-yt-info', url),
  fetchPlaylistInfo: (url: string) => ipcRenderer.invoke('fetch-playlist-info', url),
  downloadYtAudio: (id: string, url: string, title: string) =>
    ipcRenderer.invoke('download-yt-audio', id, url, title),
  writeAudioMetadata: (filePath: string, metadata: Partial<Song>) =>
    ipcRenderer.invoke('write-audio-metadata', filePath, metadata),
  onDownloadProgress: (callback: (data: { id: string; percent: number }) => void) => {
    const listener = (_event: IpcRendererEvent, data: { id: string; percent: number }) =>
      callback(data)
    ipcRenderer.on('download-progress', listener)
    return () => ipcRenderer.off('download-progress', listener)
  },
  onImportProgress: (callback) => {
    const listener = (_event: IpcRendererEvent, percent: number) => callback(percent)
    ipcRenderer.on('library:import-progress', listener)
    return () => ipcRenderer.off('library:import-progress', listener)
  },
  openItemPath: (filePath: string) => ipcRenderer.invoke('open-item-path', filePath),
  openDownloadsFolder: () => ipcRenderer.invoke('open-downloads-folder'),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),

  // Auto Update Implementations (Mới thêm)
  onUpdateAvailable: (callback) => {
    const listener = (_event: IpcRendererEvent, version: string) => callback(version)
    ipcRenderer.on('update-available', listener)
    return () => ipcRenderer.off('update-available', listener)
  },
  onUpdateProgress: (callback) => {
    const listener = (_event: IpcRendererEvent, percent: number) => callback(percent)
    ipcRenderer.on('update-progress', listener)
    return () => ipcRenderer.off('update-progress', listener)
  },
  onUpdateDownloaded: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('update-downloaded', listener)
    return () => ipcRenderer.off('update-downloaded', listener)
  },
  onUpdateNotAvailable: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('update-not-available', listener)
    return () => ipcRenderer.off('update-not-available', listener)
  },
  onUpdateError: (callback) => {
    const listener = (_event: IpcRendererEvent, error: string) => callback(error)
    ipcRenderer.on('update-error', listener)
    return () => ipcRenderer.off('update-error', listener)
  },
  restartApp: () => ipcRenderer.invoke('restart-app'),
  checkForUpdatesManual: () => ipcRenderer.invoke('check-for-updates-manual'),
  log: (level, message) => ipcRenderer.send('electron-log-message', { level, message }),
  resetCache: () => ipcRenderer.invoke('library:reset-cache'),
  getSyncHistory: () => ipcRenderer.invoke('library:getSyncHistory'),
  clearSyncHistory: () => ipcRenderer.invoke('library:clearSyncHistory'),
  logSyncEvent: (stats: SyncStats, details: string[]) => ipcRenderer.invoke('library:logSyncEvent', stats, details),

  // YouTube Authentication (Flow 2 bước: mở browser → xác nhận → trích cookie)
  openYoutubeAuth: () => ipcRenderer.invoke('open-youtube-auth'),
  openYoutubeBrowser: () => ipcRenderer.invoke('open-youtube-browser'),
  extractYoutubeCookies: (browserHint?: string) => ipcRenderer.invoke('extract-youtube-cookies', browserHint),
  importYoutubeCookiesFile: () => ipcRenderer.invoke('import-youtube-cookies-file'),
  logoutYoutube: () => ipcRenderer.invoke('logout-youtube'),
  getYoutubeAuthStatus: () => ipcRenderer.invoke('get-youtube-auth-status'),
  onYoutubeAuthRequired: (callback) => {
    const listener = (_event: IpcRendererEvent, data: { url: string; id?: string }) => callback(data)
    ipcRenderer.on('youtube-auth-required', listener)
    return () => ipcRenderer.off('youtube-auth-required', listener)
  },
  getPathForFile: (file: File) => {
    try {
      return webUtils.getPathForFile(file)
    } catch (err) {
      console.error('getPathForFile error:', err)
      return ''
    }
  },
  quitApp: () => ipcRenderer.invoke('quit-app'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
