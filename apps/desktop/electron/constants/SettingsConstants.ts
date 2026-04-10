import { app } from 'electron';
import path from 'node:path';

export const DEFAULT_SETTINGS = {
  general: {
    language: 'vi',
    notifications: true,
  },
  appearance: {
    theme: 'midnight',
  },
  audio: {
    deviceId: 'default',
  },
  downloads: {
    downloadPath: '', // Will be set dynamically
    autoImportPaths: [] as string[],
    bitrate: '320',
  }
};

export const getSafeDefaultDownloadPath = () => {
    try {
        const musicDir = app.getPath('music');
        return path.join(musicDir, 'Melovista Downloads');
    } catch {
        return '';
    }
};

export type AppSettings = typeof DEFAULT_SETTINGS;
