import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

/**
 * Helper to apply mockup data to the download manager for UI debugging.
 */
export const applyDownloaderMockup = (manager: any) => {
  const previewItems: DownloadItem[] = [
    { id: '1', url: 'https://youtube.com/watch?v=mock1', title: 'Mơ ft. Hậu Vi (Official Audio)', artist: 'Đen', album: 'KOBUKOVU', status: DOWNLOAD_STATUS.SUCCESS, progress: 100, thumbnail: 'https://i.ytimg.com/vi/mock1/hqdefault.jpg' },
    { id: '2', url: 'https://youtube.com/watch?v=mock2', title: 'Cô Gái Bàn Bên ft Lynk Lee', artist: 'Đen', album: 'KOBUKOVU', status: DOWNLOAD_STATUS.DOWNLOADING, progress: 45, thumbnail: 'https://i.ytimg.com/vi/mock2/hqdefault.jpg' },
    { id: '3', url: 'https://youtube.com/watch?v=mock3', title: 'Mưa Trên Những Mái Tôn', artist: 'Đen', album: 'KOBUKOVU', status: DOWNLOAD_STATUS.PENDING, progress: 0, thumbnail: 'https://i.ytimg.com/vi/mock3/hqdefault.jpg' },
  ];


  return {
    ...manager,
    downloadState: DOWNLOAD_STATUS.DOWNLOADING,
    playlistTitle: 'Playlist Nhạc Đen Vâu Mockup',
    activeCount: 2,
    totalProgress: 35,
    previewItems,
    downloads: new Map(previewItems.map(item => [item.id, item]))
  } as any;
};


// Global debug flag (can be toggled here once for all components)
export const IS_DEBUG_DOWNLOADER = false;
