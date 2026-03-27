import { ipcMain, dialog } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ElectronStorageAdapter, MetadataService } from '../../src/infrastructure/services';
import type { Song } from '@music/types';
import { LibraryService } from '@music/core';

const storageAdapter = new ElectronStorageAdapter();
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
  ipcMain.handle('library:get', () => {
    return {
      songs: storageAdapter.getSongList(),
      library: storageAdapter.getLibrary()
    };
  });

  ipcMain.handle('library:getPlaylists', () => {
    return Object.values(storageAdapter.getPlaylists());
  });

  ipcMain.handle('library:createPlaylist', (_event, name: string) => {
    return libraryService.createPlaylist(name);
  });

  ipcMain.handle('library:updatePlaylist', (_event, playlist: any) => {
    return libraryService.updatePlaylist(playlist);
  });

  ipcMain.handle('library:updateSong', (_event, song: any) => {
    return libraryService.updateSong(song);
  });

  ipcMain.handle('library:deleteSong', (_event, songId: string) => {
    return libraryService.deleteSong(songId);
  });

  ipcMain.handle('library:deletePlaylist', (_event, playlistId: string) => {
    return libraryService.deletePlaylist(playlistId);
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
          const songData = await MetadataService.extractMetadata(filePath);
          if (songData) newSongs.push(songData);
        } catch (err) {
          console.error(`Metadata error for ${filePath}:`, err);
        }
      }

      const { addedCount, duplicatePaths } = libraryService.processAndAddSongs(newSongs);
      return {
        success: true,
        count: addedCount,
        duplicates: duplicatePaths,
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
          const songData = await MetadataService.extractMetadata(filePath);
          if (songData) newSongs.push(songData);
        } catch (err) {
          console.error(`Metadata error for ${filePath}:`, err);
        }
      }

      const { addedCount, duplicatePaths } = libraryService.processAndAddSongs(newSongs);
      return {
        success: true,
        count: addedCount,
        duplicates: duplicatePaths,
        totalAttempted: audioFiles.length
      };
    } catch (err) {
      console.error('IPC importFolder error:', err);
      return { success: false, count: 0, reason: 'ERROR', message: String(err) };
    }
  });
}
