import { DOWNLOAD_STATUS, type DownloadStatus } from '@music/types';

export const STALE_DOWNLOAD_STATES: DownloadStatus[] = [
    DOWNLOAD_STATUS.SUCCESS, 
    DOWNLOAD_STATUS.ERROR
];
