import { ipcMain, app, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { YoutubeDownloader } from '../modules/downloader/YoutubeDownloader';
import { MetadataManager } from '../modules/metadata/MetadataManager';
import type { ID3Metadata } from '../modules/metadata/MetadataManager';
import { logFileTrace } from '../infrastructure/FileTraceLogger';

const downloader = new YoutubeDownloader();
const metadataManager = new MetadataManager();

const getDownloadsDir = async () => {
    // Save to User's Music/Melovista Downloads folder
    const musicDir = app.getPath('music');
    const downloadsDir = path.join(musicDir, 'Melovista Downloads');
    await fs.mkdir(downloadsDir, { recursive: true });
    logFileTrace('downloader.getDownloadsDir', downloadsDir, 'SUCCESS', 'Ensured downloads directory exists');
    return downloadsDir;
};

export const setupDownloaderIPC = () => {
    ipcMain.handle('fetch-yt-info', async (_event, url: string) => {
        try {
            const info = await downloader.getInfo(url);
            return { success: true, info };
        } catch (error) {
            if (error instanceof Error) {
                console.error('IPC fetch-yt-info error:', error);
                return { success: false, error: error.message };
            }
            console.error('IPC fetch-yt-info error:', error);
            return { success: false, error: 'Unknown error' };
        }
    });

    ipcMain.handle('download-yt-audio', async (event, url: string, title: string) => {
        try {
            const downloadsDir = await getDownloadsDir();
            // Sanitize filename
            const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const outputPath = path.join(downloadsDir, `${safeTitle}_${Date.now()}.mp3`);
            logFileTrace('download-yt-audio.prepare', outputPath, 'SUCCESS', `Downloading audio for URL=${url}`);

            // Setup a one-time progress listener for this download
            const progressHandler = (percent: number) => {
                event.sender.send('download-progress', { url, percent });
            };
            downloader.on('progress', progressHandler);

            const savedPath = await downloader.downloadAudio(url, outputPath);
            logFileTrace('download-yt-audio.completed', savedPath, 'SUCCESS', 'Downloaded audio to file');

            downloader.off('progress', progressHandler);

            return { success: true, filePath: savedPath };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logFileTrace('download-yt-audio', undefined, 'FAIL', message);
            if (error instanceof Error) {
                console.error('IPC download-yt-audio error:', error);
                return { success: false, error: error.message };
            }
            console.error('IPC download-yt-audio error:', error);
            return { success: false, error: 'Unknown error' };
        }
    });

    ipcMain.handle('write-audio-metadata', async (_event, filePath: string, metadata: ID3Metadata) => {
        try {
            logFileTrace('write-audio-metadata', filePath, 'SUCCESS', 'Writing audio metadata via IPC');
            const success = await metadataManager.writeMetadata(filePath, metadata);
            return { success };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logFileTrace('write-audio-metadata', filePath, 'FAIL', message);
            if (error instanceof Error) {
                console.error('IPC write-audio-metadata error:', error);
                return { success: false, error: error.message };
            }
            console.error('IPC write-audio-metadata error:', error);
            return { success: false, error: 'Unknown error' };
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
            console.error('[IPC] Failed to delete file:', err);
            return { success: false };
        }
    });
};
