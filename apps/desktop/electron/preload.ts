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
  deletePlaylist: (playlistId: string) => ipcRenderer.invoke('library:deletePlaylist', playlistId),
  pickImage: () => ipcRenderer.invoke('library:pickImage'),
  addSongs: (songs: any[]) => ipcRenderer.invoke('library:addSongs', songs),
  
  // Storage operations
  getLibraryData: () => ipcRenderer.invoke('storage:getLibrary'),
  getSongsData: () => ipcRenderer.invoke('storage:getSongs'),
  getPlaylistsData: () => ipcRenderer.invoke('storage:getPlaylists'),
  saveSongsData: (songs: any) => ipcRenderer.invoke('storage:saveSongs', songs),
  saveLibraryData: (library: any) => ipcRenderer.invoke('storage:saveLibrary', library),
  savePlaylistsData: (playlists: any) => ipcRenderer.invoke('storage:savePlaylists', playlists),
  getPlayerState: () => ipcRenderer.invoke('storage:getPlayerState'),
  savePlayerState: (state: any) => ipcRenderer.invoke('storage:savePlayerState', state),
});
