import { ipcMain, app, shell, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { YoutubeDownloader } from '../modules/downloader/YoutubeDownloader';
import { MetadataManager } from '../modules/metadata/MetadataManager';
import type { ID3Metadata } from '../modules/metadata/MetadataManager';
import { logFileTrace } from '../infrastructure/FileTraceLogger';
import { normalizeString } from '@music/utils';
import log from 'electron-log/main';

import { MainStorageAdapter } from '../infrastructure/MainStorageAdapter';
import { YouTubeAuthService } from '../modules/auth/YouTubeAuthService';

const downloader = new YoutubeDownloader();
const metadataManager = new MetadataManager();

const storageAdapter = new MainStorageAdapter();
const authService = new YouTubeAuthService();

const getDownloadsDir = async () => {
    const settings = await storageAdapter.getSettings();
    let downloadsDir = settings.downloads.downloadPath;

    if (!downloadsDir) {
        const musicDir = app.getPath('music');
        downloadsDir = path.join(musicDir, 'Melovista Downloads');
    }

    await fs.mkdir(downloadsDir, { recursive: true });
    logFileTrace('downloader.getDownloadsDir', downloadsDir, 'SUCCESS', 'Resolved download path from settings');
    return downloadsDir;
};

export const setupDownloaderIPC = () => {
    // Global Progress Listener
    downloader.on('progress', (data: { id: string; percent: number }) => {
        BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send('download-progress', data);
        });
    });

    // Auth Required Listener
    downloader.on('auth-required', (data: { url: string; id?: string }) => {
        log.warn('[IPC] YouTube Authentication Required for:', data.url);
        BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send('youtube-auth-required', data);
        });
    });

    ipcMain.handle('fetch-yt-info', async (_event, url: string) => {
        try {
            const info = await downloader.getInfo(url);
            return { success: true, info };
        } catch (error) {
            console.error('IPC fetch-yt-info error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    });

    ipcMain.handle('fetch-playlist-info', async (_event, url: string) => {
        try {
            const result = await downloader.getPlaylistInfo(url);
            return { success: true, title: result.title, items: result.items };
        } catch (error) {
            console.error('IPC fetch-playlist-info error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    });

    ipcMain.handle('download-yt-audio', async (_event, id: string, url: string, title: string) => {
        try {
            const downloadsDir = await getDownloadsDir();
            const safeTitle = normalizeString(title).replace(/[\s_]+/g, '_');
            const outputPath = path.join(downloadsDir, `${safeTitle}_${Date.now()}.mp3`);
            
            logFileTrace('download-yt-audio.prepare', outputPath, 'SUCCESS', `Enqueuing download ID=${id} URL=${url}`);

            const savedPath = await downloader.downloadAudio(id, url, outputPath);
            
            logFileTrace('download-yt-audio.completed', savedPath, 'SUCCESS', 'Downloaded audio to file');
            return { success: true, filePath: savedPath };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logFileTrace('download-yt-audio', undefined, 'FAIL', message);
            return { success: false, error: message };
        }
    });

    // YouTube Auth IPCs
    ipcMain.handle('open-youtube-auth', async () => {
        return await authService.openAuthWindow();
    });

    ipcMain.handle('logout-youtube', async () => {
        authService.logout();
        return true;
    });

    ipcMain.handle('get-youtube-auth-status', async () => {
        return authService.isLoggedIn();
    });

    ipcMain.handle('cancel-download', async (_event, id: string) => {
        downloader.cancelDownload(id);
        return { success: true };
    });

    ipcMain.handle('write-audio-metadata', async (_event, filePath: string, metadata: ID3Metadata) => {
        try {
            logFileTrace('write-audio-metadata', filePath, 'SUCCESS', 'Writing audio metadata via IPC');
            const success = await metadataManager.writeMetadata(filePath, metadata);
            return { success };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logFileTrace('write-audio-metadata', filePath, 'FAIL', message);
            return { success: false, error: message };
        }
    });

    ipcMain.handle('open-item-path', async (_event, filePath: string) => {
        shell.showItemInFolder(filePath);
    });

    ipcMain.handle('delete-file', async (_event, filePath: string) => {
        try {
            await fs.unlink(filePath);
            logFileTrace('delete-file', filePath, 'SUCCESS', 'Deleted file from disk');
            return { success: true };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            logFileTrace('delete-file', filePath, 'FAIL', message);
            return { success: false };
        }
    });

    ipcMain.handle('open-downloads-folder', async () => {
        const downloadsDir = await getDownloadsDir();
        shell.openPath(downloadsDir);
    });
};
