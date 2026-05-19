import { DOWNLOAD_STATUS, type DownloadItem, type DownloadStatus } from '@music/types';

// Global debug flags (can be toggled here once for all components)
export const IS_DEBUG_DOWNLOADER = false;
export let MOCKUP_TYPE: 'single' | 'playlist' = 'single'; // Change to 'playlist' to test playlist UI
export let MOCKUP_STATE: DownloadStatus = DOWNLOAD_STATUS.SUCCESS; // Change to test different states (fetching, preview, downloading, success, error)

/**
 * Helper to apply mockup data to the download manager for UI debugging.
 */
export const applyDownloaderMockup = (manager: any) => {
  const getStatus = (baseStatus: DownloadStatus): DownloadStatus => {
    if (MOCKUP_STATE === DOWNLOAD_STATUS.PREVIEW) return DOWNLOAD_STATUS.PREVIEW;
    if (MOCKUP_STATE === DOWNLOAD_STATUS.SUCCESS) return DOWNLOAD_STATUS.SUCCESS;
    if (MOCKUP_STATE === DOWNLOAD_STATUS.ERROR) return DOWNLOAD_STATUS.ERROR;
    return baseStatus; // use individual item status for 'downloading'
  };

  const getProgress = (baseProgress: number) => {
    if (MOCKUP_STATE === DOWNLOAD_STATUS.SUCCESS) return 100;
    if (MOCKUP_STATE === DOWNLOAD_STATUS.PREVIEW || MOCKUP_STATE === DOWNLOAD_STATUS.FETCHING || MOCKUP_STATE === DOWNLOAD_STATUS.ERROR) return 0;
    return baseProgress;
  };

  if (MOCKUP_TYPE === 'single') {
    const items: DownloadItem[] = [
      { id: '1', url: 'https://youtube.com/watch?v=mock1', title: 'Mơ ft. Hậu Vi (Official Audio)', artist: 'Đen', album: 'YouTube Audio', status: getStatus(DOWNLOAD_STATUS.DOWNLOADING), progress: getProgress(45), thumbnail: 'https://i.ytimg.com/vi/mock1/hqdefault.jpg', error: MOCKUP_STATE === DOWNLOAD_STATUS.ERROR ? 'Network error' : undefined },
    ];

    return {
      ...manager,
      url: 'https://youtube.com/watch?v=mock1',
      downloadState: MOCKUP_STATE,
      playlistTitle: null,
      activeCount: MOCKUP_STATE === DOWNLOAD_STATUS.DOWNLOADING ? 1 : 0,
      totalProgress: getProgress(45),
      previewItems: MOCKUP_STATE === DOWNLOAD_STATUS.PREVIEW ? items : [],
      downloads: (MOCKUP_STATE === DOWNLOAD_STATUS.FETCHING || MOCKUP_STATE === DOWNLOAD_STATUS.PREVIEW) ? new Map() : new Map(items.map(item => [item.id, item]))
    } as any;
  }

  // Playlist mockup
  const items: DownloadItem[] = [
    { id: '1', url: 'https://youtube.com/watch?v=mock1', title: 'Mơ ft. Hậu Vi (Official Audio)', artist: 'Đen', album: 'KOBUKOVU', status: getStatus(DOWNLOAD_STATUS.SUCCESS), progress: getProgress(100), thumbnail: 'https://i.ytimg.com/vi/mock1/hqdefault.jpg', error: MOCKUP_STATE === DOWNLOAD_STATUS.ERROR ? 'Network error' : undefined },
    { id: '2', url: 'https://youtube.com/watch?v=mock2', title: 'Cô Gái Bàn Bên ft Lynk Lee', artist: 'Đen', album: 'KOBUKOVU', status: getStatus(DOWNLOAD_STATUS.DOWNLOADING), progress: getProgress(45), thumbnail: 'https://i.ytimg.com/vi/mock2/hqdefault.jpg', error: MOCKUP_STATE === DOWNLOAD_STATUS.ERROR ? 'Network error' : undefined },
    { id: '3', url: 'https://youtube.com/watch?v=mock3', title: 'Mưa Trên Những Mái Tôn', artist: 'Đen', album: 'KOBUKOVU', status: getStatus(DOWNLOAD_STATUS.PENDING), progress: getProgress(0), thumbnail: 'https://i.ytimg.com/vi/mock3/hqdefault.jpg', error: MOCKUP_STATE === DOWNLOAD_STATUS.ERROR ? 'Network error' : undefined },
  ];

  return {
    ...manager,
    url: 'https://youtube.com/playlist?list=mockplaylist',
    downloadState: MOCKUP_STATE,
    playlistTitle: 'Playlist Nhạc Đen Vâu Mockup',
    activeCount: MOCKUP_STATE === DOWNLOAD_STATUS.DOWNLOADING ? 2 : 0,
    totalProgress: getProgress(35),
    previewItems: MOCKUP_STATE === DOWNLOAD_STATUS.PREVIEW ? items : [],
    downloads: (MOCKUP_STATE === DOWNLOAD_STATUS.FETCHING || MOCKUP_STATE === DOWNLOAD_STATUS.PREVIEW) ? new Map() : new Map(items.map(item => [item.id, item]))
  } as any;
};
