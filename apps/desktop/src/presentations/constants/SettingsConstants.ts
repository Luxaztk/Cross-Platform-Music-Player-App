export const DEFAULT_SETTINGS = {
  general: {
    language: 'vi',
    notifications: true,
    autoUpdate: true,
    minimizeToTray: false,
    startAtLogin: false,
    showLyricsOnStartup: true,
  },
  appearance: {
    theme: 'midnight' as 'midnight' | 'amoled' | 'nord' | 'rose' | 'ocean' | 'snow',
    glassmorphism: true,
    compactMode: false,
    animations: true,
    showCoverArt: true,
  },
  audio: {
    deviceId: 'default',
    exclusiveMode: false,
    volume: 0.8,
    crossfade: 0,
    normalizeVolume: true,
  },
  downloads: {
    downloadPath: '', // Will be set dynamically by Main process
    autoImportPaths: [] as string[],
    bitrate: '320' as '128' | '192' | '320',
    maxConcurrentDownloads: 3,
    folderOrganization: '{Artist}/{Album}',
    backgroundSync: 0,
    cookiesPath: '',
    browserSource: 'edge' as 'chrome' | 'edge' | 'brave' | 'firefox',
  },
  server: {
    serverUrl: '',
    autoConnect: false,
    autoPushOnDownload: true,
  }
};

export type AppSettings = typeof DEFAULT_SETTINGS;
