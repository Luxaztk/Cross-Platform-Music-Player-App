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
  deletePlaylist: (playlistId: string) => ipcRenderer.invoke('library:deletePlaylist', playlistId),
  pickImage: () => ipcRenderer.invoke('library:pickImage'),
});
