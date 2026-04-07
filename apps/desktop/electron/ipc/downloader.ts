import { ipcMain, app, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { YoutubeDownloader } from '../modules/downloader/YoutubeDownloader';
import { MetadataManager } from '../modules/metadata/MetadataManager';
import type { ID3Metadata } from '../modules/metadata/MetadataManager';

const downloader = new YoutubeDownloader();
const metadataManager = new MetadataManager();

const getDownloadsDir = async () => {
    // Save to User's Music/Melovista Downloads folder
    const musicDir = app.getPath('music');
    const downloadsDir = path.join(musicDir, 'Melovista Downloads');
    await fs.mkdir(downloadsDir, { recursive: true });
    return downloadsDir;
};

export const setupDownloaderIPC = () => {
    ipcMain.handle('fetch-yt-info', async (_event, url: string) => {
        try {
            const info = await downloader.getInfo(url);
            return { success: true, info };
        } catch (error: any) {
            console.error('IPC fetch-yt-info error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('download-yt-audio', async (event, url: string, title: string) => {
        try {
            const downloadsDir = await getDownloadsDir();
            // Sanitize filename
            const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const outputPath = path.join(downloadsDir, `${safeTitle}_${Date.now()}.mp3`);

            // Setup a one-time progress listener for this download
            const progressHandler = (percent: number) => {
                event.sender.send('download-progress', { url, percent });
            };
            downloader.on('progress', progressHandler);

            const savedPath = await downloader.downloadAudio(url, outputPath);

            downloader.off('progress', progressHandler);

            return { success: true, filePath: savedPath };
        } catch (error: any) {
            console.error('IPC download-yt-audio error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('write-audio-metadata', async (_event, filePath: string, metadata: ID3Metadata) => {
        try {
            const success = await metadataManager.writeMetadata(filePath, metadata);
            return { success };
        } catch (error: any) {
            console.error('IPC write-audio-metadata error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('open-item-path', async (_event, filePath: string) => {
        shell.showItemInFolder(filePath);
    });

    ipcMain.handle('delete-file', async (_event, filePath: string) => {
        try {
            await fs.unlink(filePath);
            console.log('[IPC] Deleted orphaned file:', filePath);
            return { success: true };
        } catch (err: any) {
            console.error('[IPC] Failed to delete file:', err);
            return { success: false };
        }
    });
};
