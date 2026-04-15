import { ipcMain, dialog } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { MainStorageAdapter } from '../infrastructure/MainStorageAdapter';
import { MainMetadataService } from '../infrastructure/MainMetadataService';
import { logFileTrace } from '../infrastructure/FileTraceLogger';
import type { DuplicateSongInfo, Song, Playlist } from '@music/types';
import { LibraryService } from '@music/core';
import { extractYoutubeId, getCanonicalYoutubeUrl, getErrorMessage, normalizeString, logger } from '@music/utils';
import { LyricsManager } from '../modules/lyrics/LyricsManager';

const storageAdapter = new MainStorageAdapter();
const libraryService = new LibraryService(storageAdapter);
const lyricsManager = new LyricsManager();

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
    const message = err instanceof Error ? err.message : String(err);
    logFileTrace('scanDirectory', dir, 'FAIL', message);
    console.error(`Error scanning directory ${dir}:`, err);
  }
  return files;
}

/**
 * One-time migration: Recalculate audio hashes for ALL songs in the library.
 * This ensures that old hashes (binary-based or p1) are updated to the current 
 * Perceptual Hashing v2 algorithm (p2: prefix).
 */
async function rehashAllSongs(): Promise<void> {
  try {
    const songs = await storageAdapter.getSongs();
    const songList = Object.values(songs);

    // Filter only songs that NEED migration (missing p2: prefix)
    const pendingMigration = songList.filter(s => !s.hash?.startsWith('p2:'));

    if (pendingMigration.length === 0) {
      console.log(`[Rehash] All ${songList.length} song hashes are up-to-date (p2 format).`);
      return;
    }

    console.log(`[Rehash] Starting migration for ${pendingMigration.length} songs...`);

    let processedCount = 0;
    let successCount = 0;
    const batchSize = 5;

    // Process in batches to avoid CPU/IO hogging
    for (let i = 0; i < pendingMigration.length; i += batchSize) {
      const batch = pendingMigration.slice(i, i + batchSize);

      await Promise.all(batch.map(async (song) => {
        try {
          // Check if file exists
          await fs.access(song.filePath, fs.constants.F_OK);

          const newHash = await MainMetadataService.calculateAudioHash(song.filePath);

          if (newHash.startsWith('p2:')) {
            songs[song.id] = { ...song, hash: newHash };
            successCount++;
          }
        } catch (err) {
          const error = err as NodeJS.ErrnoException;

          if (error.code === 'ENOENT') {
            // Chỉ log ở mức debug vì đây là case dự kiến (file bị xóa/di chuyển)
            console.warn(`[Rehash] File missing, skipping: ${song.filePath}`);
          } else {
            // Các lỗi khác (EPERM, EBUSY) cần log rõ để debug
            console.error(`[Rehash] Failed to process ${song.id}:`, error.message);
          }
        }
      }));

      processedCount += batch.length;
      console.log(`[Rehash] Progress: ${processedCount}/${pendingMigration.length} matched...`);

      // Save incrementally after each batch
      await storageAdapter.saveSongs(songs);
    }

    console.log(`[Rehash] Migration finished. Updated ${successCount}/${pendingMigration.length} songs.`);
  } catch (err) {
    console.error('[Rehash] Migration error:', err);
  }
}

export function setupLibraryIPC() {
  // Run rehash migration in the background on startup
  rehashAllSongs();
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

  ipcMain.handle('library:updatePlaylist', async (_event, playlist: Playlist) => {
    return await libraryService.updatePlaylist(playlist);
  });

  ipcMain.handle('library:updateSong', async (_event, song: Song) => {
    const updated = await libraryService.updateSong(song);

    // Background task: Persistence to physical file
    // We don't 'await' it to keep the UI snappy, but we trigger it
    MainMetadataService.updatePhysicalMetadata(updated).catch(err => {
      console.error('[IPC] Failed to update physical metadata for song:', updated.id, err);
    });

    return updated;
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

  ipcMain.handle('library:addSongsToPlaylist', async (_event, playlistId: string, songIds: string[]) => {
    return await libraryService.addSongsToPlaylist(playlistId, songIds);
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
      const data = await fs.readFile(filePath);
      logFileTrace('library:pickImage.readFile', filePath, data.length === 0 ? 'EMPTY_BUFFER' : 'SUCCESS', `Loaded image (${mimeType}), bytes=${data.length}`);
      return `data:image/${mimeType};base64,${data.toString('base64')}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logFileTrace('library:pickImage.readFile', filePath, 'FAIL', message);
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
          logFileTrace('library:importFiles.extractMetadata', filePath, 'SUCCESS', 'Importing file');
          const songData = await MainMetadataService.extractMetadata(filePath);
          if (songData) {
            newSongs.push(songData);
          } else {
            logFileTrace('library:importFiles.extractMetadata', filePath, 'FAIL', 'Metadata extraction returned null');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logFileTrace('library:importFiles.extractMetadata', filePath, 'FAIL', message);
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
      return { success: false, count: 0, reason: 'ERROR', message: getErrorMessage(err) };
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
          logFileTrace('library:importFolder.extractMetadata', filePath, 'SUCCESS', 'Importing file from folder');
          const songData = await MainMetadataService.extractMetadata(filePath);
          if (songData) {
            newSongs.push(songData);
          } else {
            logFileTrace('library:importFolder.extractMetadata', filePath, 'FAIL', 'Metadata extraction returned null');
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logFileTrace('library:importFolder.extractMetadata', filePath, 'FAIL', message);
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
      return { success: false, count: 0, reason: 'ERROR', message: getErrorMessage(err) };
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
      return { success: false, count: 0, message: getErrorMessage(err) };
    }
  });

  ipcMain.handle('library:importFromPath', async (_event, filePath: string, sourceUrl?: string, originId?: string) => {
    try {
      logger.info('[IPC] importFromPath triggered', { filePath, sourceUrl });
      logFileTrace('library:importFromPath', filePath, 'SUCCESS', `Importing downloaded or external file sourceUrl=${sourceUrl}`);
      const canonicalUrl = sourceUrl ? getCanonicalYoutubeUrl(sourceUrl) || sourceUrl : sourceUrl;
      const songData = await MainMetadataService.extractMetadata(filePath, canonicalUrl, originId);
      if (!songData) {
        logger.warn('[IPC] Metadata extraction returned null', { filePath });
        logFileTrace('library:importFromPath', filePath, 'FAIL', 'Metadata extraction returned null');
        return { success: false, reason: 'METADATA_ERROR' };
      }

      logger.debug('[Library] Extracted raw metadata', { title: songData.title, artist: songData.artist, hash: songData.hash });


      const { addedCount, duplicatePaths, duplicateSongs } = await libraryService.processAndAddSongs([songData]);

      const isDuplicate = addedCount === 0;
      let duplicateReason: string | undefined;

      if (isDuplicate && duplicateSongs.length > 0) {
        duplicateReason = (duplicateSongs[0] as DuplicateSongInfo).duplicateReason;

        // Automated Cleanup: Delete the redundant downloaded file if it's a duplicate
        // We only do this for online downloads (where sourceUrl is provided) to avoid accidental deletion of manual imports
        if (sourceUrl && (duplicateReason === 'HASH' || duplicateReason === 'URL' || duplicateReason === 'METADATA')) {
          try {
            await fs.unlink(filePath);
            logger.info('[Library] Final Action: UNLINKED', { path: filePath, reason: duplicateReason });
          } catch (unlinkErr) {
            logger.error(`[library:importFromPath] Failed to delete duplicate file: ${filePath}`, unlinkErr);
          }
        }
      }

      return {
        success: true,
        count: addedCount,
        duplicates: duplicatePaths,
        duplicateSongs: duplicateSongs,
        reason: duplicateReason
      };
    } catch (err) {
      console.error('IPC library:importFromPath error:', err);
      return { success: false, reason: 'ERROR', message: getErrorMessage(err) };
    }
  });

  ipcMain.handle('library:checkDuplicate', async (_event, title: string, artist: string, url?: string, id?: string) => {
    try {
      const songs = await storageAdapter.getSongs();
      const existingSongs = Object.values(songs);

      // 1. Check by Source ID or URL (Highest priority for online downloads)
      const inputUrl = url?.trim();
      const inputId = id || (inputUrl ? extractYoutubeId(inputUrl) : null);

      if (inputId || inputUrl) {
        const urlMatch = existingSongs.find(s => {
          // Priority 1: Direct originId match (Fastest and most accurate)
          if (inputId && s.originId === inputId) return true;

          // Priority 2: Standard URL / ID extraction match (Fallback for legacy/other sources)
          if (!s.sourceUrl) return false;

          const storedUrl = s.sourceUrl.trim();
          const storedId = extractYoutubeId(storedUrl);

          const idMatch = inputId && storedId && inputId === storedId;
          const urlMatchRaw = inputUrl && storedUrl === inputUrl;

          return idMatch || urlMatchRaw;
        });

        if (urlMatch) {
          return {
            isDuplicate: true,
            reason: 'URL',
            existingSong: { id: urlMatch.id, title: urlMatch.title, artist: urlMatch.artist }
          };
        }
      }

      const normalizedTitle = normalizeString(title.trim());
      const normalizedArtist = normalizeString(artist.trim());

      const match = existingSongs.find(s => {
        const titleMatch = normalizeString(s.title) === normalizedTitle;
        // Artist matching is more lenient - check if one contains the other
        const storedArtist = normalizeString(s.artist);
        const artistMatch =
          storedArtist === normalizedArtist ||
          storedArtist.includes(normalizedArtist) ||
          normalizedArtist.includes(storedArtist);
        return titleMatch && artistMatch;
      });

      return {
        isDuplicate: !!match,
        reason: match ? 'METADATA' : null,
        existingSong: match ? { id: match.id, title: match.title, artist: match.artist } : null
      };
    } catch (err) {
      console.error('IPC library:checkDuplicate error:', err);
      return { isDuplicate: false, existingSong: null };
    }
  });

  ipcMain.handle('library:scanMissingFiles', async () => {
    try {
      const songsMap = await storageAdapter.getSongs();
      const songs = Object.values(songsMap);
      const missingIds: string[] = [];

      for (const song of songs) {
        try {
          await fs.access(song.filePath, fs.constants.F_OK);
          logFileTrace('library:scanMissingFiles.access', song.filePath, 'SUCCESS', `File exists for songId=${song.id}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logFileTrace('library:scanMissingFiles.access', song.filePath, 'FAIL', message);
          missingIds.push(song.id);
        }
      }

      return missingIds;
    } catch (err) {
      console.error('IPC library:scanMissingFiles error:', err);
      return [];
    }
  });

  ipcMain.handle('library:getLyrics', async (_event, songId: string) => {
    try {
      const song = await storageAdapter.getSongById(songId);
      if (!song) return null;

      // Priority 1: Use Database (Fastest and most persistent for Melovista-selected lyrics)
      if (song.syncedLyrics || song.lyrics) {
        return song.syncedLyrics || song.lyrics;
      }

      // Priority 2: Fallback to physical file scan
      const metadata = await MainMetadataService.extractMetadata(song.filePath);
      return metadata?.syncedLyrics || metadata?.lyrics || null;
    } catch (err) {
      console.error('IPC library:getLyrics error:', err);
      return null;
    }
  });

  ipcMain.handle('library:saveLyrics', async (_event, songId: string, lyrics: string, lyricId?: number) => {
    try {
      console.log(`[IPC] library:saveLyrics for songId: ${songId}, lyricId: ${lyricId}`);
      const song = await storageAdapter.getSongById(songId);
      if (!song) return false;

      // 1. Physical metadata update (for MP3)
      const success = await lyricsManager.saveLyrics(song.filePath, lyrics, lyricId);

      // 2. Database update (important for consistency and all formats)
      const songsMap = await storageAdapter.getSongs();
      if (songsMap[songId]) {
        songsMap[songId] = {
          ...songsMap[songId],
          syncedLyrics: lyrics,
          lyricId: lyricId
        };
        await storageAdapter.saveSongs(songsMap);
      }

      // 3. Usage tracking
      if (lyricId) {
        await storageAdapter.incrementLyricUsage(lyricId);
      }

      return success;
    } catch (err) {
      console.error('IPC library:saveLyrics error:', err);
      return false;
    }
  });

  ipcMain.handle('library:searchLyrics', async (_event, query: string) => {
    try {
      const results = await lyricsManager.search(query);
      const usage = await storageAdapter.getLyricUsage();

      // Sort results: 
      // 1. Usage count (descending)
      // 2. Presence of synced lyrics
      return results.sort((a, b) => {
        const usageA = usage[a.id.toString()] || 0;
        const usageB = usage[b.id.toString()] || 0;

        if (usageB !== usageA) return usageB - usageA;
        if (!!b.syncedLyrics !== !!a.syncedLyrics) return b.syncedLyrics ? 1 : -1;
        return 0;
      });
    } catch (err) {
      console.error('IPC library:searchLyrics error:', err);
      return [];
    }
  });
}
