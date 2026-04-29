import type { DownloadState } from '../../application/hooks/DownloadContext';

export const STALE_DOWNLOAD_STATES: DownloadState[] = ['fetching', 'preview', 'downloading', 'success', 'error'];
