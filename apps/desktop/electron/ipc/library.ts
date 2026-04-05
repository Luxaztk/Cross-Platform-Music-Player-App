import { ipcMain, dialog } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { MainStorageAdapter } from '../infrastructure/MainStorageAdapter';
import { MainMetadataService } from '../infrastructure/MainMetadataService';
import type { Song } from '@music/types';
import { LibraryService } from '@music/core';

const storageAdapter = new MainStorageAdapter();
const libraryService = new LibraryService(storageAdapter);

const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.aac', '.wav', '.m4a', '.ogg'];

async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err);
  }
  return files;
}

export function setupLibraryIPC() {
  ipcMain.handle('library:get', async () => {
    return {
      songs: await storageAdapter.getSongList(),
      library: await storageAdapter.getLibrary()
    };
  });

  ipcMain.handle('library:getPlaylists', async () => {
    const playlists = await storageAdapter.getPlaylists();
    return Object.values(playlists);
  });

  ipcMain.handle('library:createPlaylist', async (_event, name: string) => {
    return await libraryService.createPlaylist(name);
  });

  ipcMain.handle('library:updatePlaylist', async (_event, playlist: any) => {
    return await libraryService.updatePlaylist(playlist);
  });

  ipcMain.handle('library:updateSong', async (_event, song: any) => {
    return await libraryService.updateSong(song);
  });

  ipcMain.handle('library:deleteSong', async (_event, songId: string) => {
    return await libraryService.deleteSong(songId);
  });

  ipcMain.handle('library:deleteSongs', async (_event, songIds: string[]) => {
    return await libraryService.deleteSongs(songIds);
  });

  ipcMain.handle('library:removeSongsFromPlaylist', async (_event, playlistId: string, songIds: string[]) => {
    return await libraryService.removeSongsFromPlaylist(playlistId, songIds);
  });

  ipcMain.handle('library:deletePlaylist', async (_event, playlistId: string) => {
    return await libraryService.deletePlaylist(playlistId);
  });


  ipcMain.handle('library:pickImage', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'webp', 'jpeg'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const extension = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeType = extension === 'jpg' ? 'jpeg' : extension;
    
    try {
      const data = require('node:fs').readFileSync(filePath);
      return `data:image/${mimeType};base64,${data.toString('base64')}`;
    } catch (error) {
      console.error('Error reading image file:', error);
      return null;
    }
  });

  ipcMain.handle('library:importFiles', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Audio Files', extensions: ['mp3', 'flac', 'aac', 'wav', 'm4a', 'ogg'] }]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, count: 0, reason: 'CANCELED' };
      }

      const newSongs: Song[] = [];
      for (const filePath of result.filePaths) {
        try {
          const songData = await MainMetadataService.extractMetadata(filePath);
          if (songData) newSongs.push(songData);
        } catch (err) {
          console.error(`Metadata error for ${filePath}:`, err);
        }
      }

      const { addedCount, duplicatePaths, duplicateSongs } = await libraryService.processAndAddSongs(newSongs);
      return {
        success: true,
        count: addedCount,
        duplicates: duplicatePaths,
        duplicateSongs: duplicateSongs,
        totalAttempted: result.filePaths.length
      };
    } catch (err) {
      console.error('IPC importFiles error:', err);
      return { success: false, count: 0, reason: 'ERROR', message: String(err) };
    }
  });

  ipcMain.handle('library:importFolder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, count: 0, reason: 'CANCELED' };
      }

      const dirPath = result.filePaths[0];
      const audioFiles = await scanDirectory(dirPath);

      const newSongs: Song[] = [];
      for (const filePath of audioFiles) {
        try {
          const songData = await MainMetadataService.extractMetadata(filePath);
          if (songData) newSongs.push(songData);
        } catch (err) {
          console.error(`Metadata error for ${filePath}:`, err);
        }
      }

      const { addedCount, duplicatePaths, duplicateSongs } = await libraryService.processAndAddSongs(newSongs);
      return {
        success: true,
        count: addedCount,
        duplicates: duplicatePaths,
        duplicateSongs: duplicateSongs,
        totalAttempted: audioFiles.length
      };
    } catch (err) {
      console.error('IPC importFolder error:', err);
      return { success: false, count: 0, reason: 'ERROR', message: String(err) };
    }
  });

  // New handler to force add songs (e.g. from duplicate resolution)
  ipcMain.handle('library:addSongs', async (_event, songsToAdd: Song[]) => {
    try {
      // We manually add them without deduplication check or with a "force" flag
      // For now, we'll just use a simple manual addition since they are already processed
      const currentSongs = await storageAdapter.getSongs();
      const currentLibrary = await storageAdapter.getLibrary();
      
      const updatedSongs = { ...currentSongs };
      const updatedLibrary = { ...currentLibrary, songIds: [...currentLibrary.songIds] };
      
      let addedCount = 0;
      for (const song of songsToAdd) {
        // Even in force add, we avoid adding the EXACT same object if it somehow already exists by ID
        updatedSongs[song.id] = song;
        if (!updatedLibrary.songIds.includes(song.id)) {
          updatedLibrary.songIds.push(song.id);
          addedCount++;
        }
      }
      
      await storageAdapter.saveSongs(updatedSongs);
      await storageAdapter.saveLibrary(updatedLibrary);
      
      return { success: true, count: addedCount };
    } catch (err) {
      console.error('IPC addSongs error:', err);
      return { success: false, count: 0, message: String(err) };
    }
  });
}
