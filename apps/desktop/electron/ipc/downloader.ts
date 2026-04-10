import { ipcMain, app, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { YoutubeDownloader } from '../modules/downloader/YoutubeDownloader';
import { MetadataManager } from '../modules/metadata/MetadataManager';
import { storageAdapter } from './storage';
import type { ID3Metadata } from '../modules/metadata/MetadataManager';
import crypto from 'node:crypto';
import { normalizePathForHash } from '@music/utils';

const downloader = new YoutubeDownloader();
const metadataManager = new MetadataManager();

const getDownloadsDir = async () => {
    // 1. Get custom path from settings
    const settings = await storageAdapter.getSettings();
    if (settings.downloads.downloadPath) {
        await fs.mkdir(settings.downloads.downloadPath, { recursive: true });
        return settings.downloads.downloadPath;
    }

    // 2. Fallback to default Melovista Downloads folder
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

            // Setup a one-time progress listener for this download
            const progressHandler = (percent: number) => {
                event.sender.send('download-progress', { url, percent });
            };
            downloader.on('progress', progressHandler);

            const savedPath = await downloader.downloadAudio(url, outputPath);

            downloader.off('progress', progressHandler);

            try {
                const info = await downloader.getInfo(url);

                if (info.thumbnail) {
                    const coversDir = path.join(app.getPath('userData'), 'cache', 'covers');
                    await fs.mkdir(coversDir, { recursive: true });

                    // Tải ảnh từ Youtube (Node 18+ hỗ trợ sẵn fetch)
                    const response = await fetch(info.thumbnail);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Băm MD5 chuẩn hóa y như Worker và Main
                    const hash = crypto.createHash('md5').update(normalizePathForHash(savedPath)).digest('hex');
                    const safeFileName = `${hash}.jpg`;
                    const coverPath = path.join(coversDir, safeFileName);

                    // Ghi file ảnh xuống ổ cứng
                    await fs.writeFile(coverPath, buffer);
                    console.log(`[Downloader] Đã lưu Thumbnail YouTube: ${safeFileName}`);
                }
            } catch (thumbErr) {
                console.error('[Downloader] Lỗi khi tải thumbnail từ Youtube:', thumbErr);
            }

            return { success: true, filePath: savedPath };
        } catch (error) {
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
            const success = await metadataManager.writeMetadata(filePath, metadata);
            return { success };
        } catch (error) {
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
            if (!filePath) return { success: false, error: 'Path is required' };

            // 1. Normalize and resolve the path
            const normalizedPath = path.resolve(filePath);
            const downloadsDir = await getDownloadsDir();
            const musicDir = app.getPath('music');

            // 2. Security Guardrail: Only allow deletion within controlled directories
            // We allow Melovista Downloads and the general Music folder (if standard file)
            const isInsideDownloads = normalizedPath.startsWith(downloadsDir);
            const isInsideMusic = normalizedPath.startsWith(musicDir);

            if (!isInsideDownloads && !isInsideMusic) {
                console.warn(`[Security] Unauthorized delete attempt: ${normalizedPath}`);
                return { success: false, error: 'Unauthorized: Cannot delete files outside of designated directories.' };
            }

            // 3. Final safety: Ensure it exists before unlinking
            await fs.access(normalizedPath);
            await fs.unlink(normalizedPath);

            console.log('[IPC] Securely deleted file:', normalizedPath);
            return { success: true };
        } catch (err: unknown) {
            console.error('[IPC] Failed to delete file:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
        }
    });
};
