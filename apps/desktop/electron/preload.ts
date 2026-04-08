import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  importFiles: () => ipcRenderer.invoke('library:importFiles'),
  importFolder: () => ipcRenderer.invoke('library:importFolder'),
  getLibrary: () => ipcRenderer.invoke('library:get'),
  getPlaylists: () => ipcRenderer.invoke('library:getPlaylists'),
  createPlaylist: (name: string) => ipcRenderer.invoke('library:createPlaylist', name),
  updatePlaylist: (playlist: any) => ipcRenderer.invoke('library:updatePlaylist', playlist),
  updateSong: (song: any) => ipcRenderer.invoke('library:updateSong', song),
  deleteSong: (songId: string) => ipcRenderer.invoke('library:deleteSong', songId),
  deleteSongs: (songIds: string[]) => ipcRenderer.invoke('library:deleteSongs', songIds),
  removeSongsFromPlaylist: (playlistId: string, songIds: string[]) => ipcRenderer.invoke('library:removeSongsFromPlaylist', playlistId, songIds),
  addSongsToPlaylist: (playlistId: string, songIds: string[]) => ipcRenderer.invoke('library:addSongsToPlaylist', playlistId, songIds),
  deletePlaylist: (playlistId: string) => ipcRenderer.invoke('library:deletePlaylist', playlistId),
  pickImage: () => ipcRenderer.invoke('library:pickImage'),
  addSongs: (songs: any[]) => ipcRenderer.invoke('library:addSongs', songs),
  importFromPath: (filePath: string, sourceUrl?: string, originId?: string) => ipcRenderer.invoke('library:importFromPath', filePath, sourceUrl, originId),
  checkDuplicate: (title: string, artist: string, url?: string, id?: string) => ipcRenderer.invoke('library:checkDuplicate', title, artist, url, id),
  scanMissingFiles: () => ipcRenderer.invoke('library:scanMissingFiles'),
  getLyrics: (songId: string) => ipcRenderer.invoke('library:getLyrics', songId),
  saveLyrics: (songId: string, lyrics: string, lyricId?: number) => ipcRenderer.invoke('library:saveLyrics', songId, lyrics, lyricId),
  searchLyrics: (query: string) => ipcRenderer.invoke('library:searchLyrics', query),
  
  // Storage operations
  getLibraryData: () => ipcRenderer.invoke('storage:getLibrary'),
  getSongsData: () => ipcRenderer.invoke('storage:getSongs'),
  getPlaylistsData: () => ipcRenderer.invoke('storage:getPlaylists'),
  saveSongsData: (songs: any) => ipcRenderer.invoke('storage:saveSongs', songs),
  saveLibraryData: (library: any) => ipcRenderer.invoke('storage:saveLibrary', library),
  savePlaylistsData: (playlists: any) => ipcRenderer.invoke('storage:savePlaylists', playlists),
  getPlayerState: () => ipcRenderer.invoke('storage:getPlayerState'),
  savePlayerState: (state: any) => ipcRenderer.invoke('storage:savePlayerState', state),
  getRecentSearches: () => ipcRenderer.invoke('storage:getRecentSearches'),
  saveRecentSearches: (searches: any) => ipcRenderer.invoke('storage:saveRecentSearches', searches),

  // Downloader operations
  fetchYtInfo: (url: string) => ipcRenderer.invoke('fetch-yt-info', url),
  downloadYtAudio: (url: string, title: string) => ipcRenderer.invoke('download-yt-audio', url, title),
  writeAudioMetadata: (filePath: string, metadata: any) => ipcRenderer.invoke('write-audio-metadata', filePath, metadata),
  onDownloadProgress: (callback: (data: { url: string; percent: number }) => void) => {
    const listener = (_event: any, data: { url: string; percent: number }) => callback(data);
    ipcRenderer.on('download-progress', listener);
    return () => ipcRenderer.off('download-progress', listener);
  },
  openItemPath: (filePath: string) => ipcRenderer.invoke('open-item-path', filePath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
});
