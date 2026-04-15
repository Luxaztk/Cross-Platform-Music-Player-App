import { ipcMain } from 'electron';
import { MainStorageAdapter } from '../infrastructure/MainStorageAdapter';
import type { PlayerState, Song } from '@music/types';

const storageAdapter = new MainStorageAdapter();

export function setupStorageIPC() {
  ipcMain.handle('storage:getLibrary', async () => {
    return await storageAdapter.getLibrary();
  });

  ipcMain.handle('storage:getSongs', async () => {
    return await storageAdapter.getSongs();
  });

  ipcMain.handle('storage:getPlaylists', async () => {
    return await storageAdapter.getPlaylists();
  });

  ipcMain.handle('storage:saveSongs', async (_event, songs) => {
    return await storageAdapter.saveSongs(songs);
  });

  ipcMain.handle('storage:saveLibrary', async (_event, library) => {
    return await storageAdapter.saveLibrary(library);
  });

  ipcMain.handle('storage:savePlaylists', async (_event, playlists) => {
    return await storageAdapter.savePlaylists(playlists);
  });

  ipcMain.handle('storage:getPlayerState', async () => {
    return await storageAdapter.getPlayerState();
  });

  ipcMain.handle('storage:savePlayerState', async (_event, state: PlayerState) => {
    return await storageAdapter.savePlayerState(state);
  });

  ipcMain.handle('storage:getRecentSearches', async () => {
    return await storageAdapter.getRecentSearches();
  });

  ipcMain.handle('storage:saveRecentSearches', async (_event, searches) => {
    return await storageAdapter.saveRecentSearches(searches);
  });

  ipcMain.handle('storage:getLyricUsage', async () => {
    return await storageAdapter.getLyricUsage();
  });

  ipcMain.handle('storage:saveLyricUsage', async (_event, usage) => {
    return await storageAdapter.saveLyricUsage(usage);
  });

  ipcMain.handle('storage:incrementLyricUsage', async (_event, id) => {
    return await storageAdapter.incrementLyricUsage(id);
  });

  ipcMain.handle('storage:patchSong', async (_event, songId: string, updates: Partial<Song>) => {
    return await storageAdapter.patchSong(songId, updates);
  });
  ipcMain.handle('storage:getSettings', async () => {
    return await storageAdapter.getSettings();
  });

  ipcMain.handle('storage:saveSettings', async (_event, settings) => {
    return await storageAdapter.saveSettings(settings);
  });
}
