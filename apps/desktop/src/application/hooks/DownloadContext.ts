import { createContext } from 'react';

export type DownloadState = 'idle' | 'fetching' | 'preview' | 'downloading' | 'success' | 'error';

export interface YouTubeVideoInfo {
    id: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
    duration?: number;
}

export interface DuplicateInfo {
    warning: { title: string; artist: string; reason?: string } | null;
    isAfterDownload: boolean;
    reasonAfterDownload: string | null;
}

export const initialDuplicateInfo: DuplicateInfo = { 
    warning: null, 
    isAfterDownload: false, 
    reasonAfterDownload: null 
};

export interface DownloadContextType {
    url: string;
    setUrl: (url: string) => void;
    downloadState: DownloadState;
    setDownloadState: (state: DownloadState) => void;
    downloadProgress: number;
    downloadError: string | null;
    videoInfo: YouTubeVideoInfo | null;
    duplicateInfo: DuplicateInfo;
    downloadedPath: string | null;
    initiator: 'modal' | 'section' | null;

    // Actions
    fetchInfo: (targetUrl?: string, source?: 'modal' | 'section') => Promise<{ success: boolean; hasWarning: boolean }>;
    executeDownload: (forceDownload?: boolean) => Promise<boolean>;
    updateMetadata: (updatedData: Partial<YouTubeVideoInfo>) => void;
    resetDownload: () => void;
    clearAbandoned: () => void;
}

export const DownloadContext = createContext<DownloadContextType | undefined>(undefined);
