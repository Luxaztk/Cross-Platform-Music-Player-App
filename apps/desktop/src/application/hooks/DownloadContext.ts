import { createContext } from 'react';
import type { DownloadItem, DownloadStatus } from '@music/types';

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
    downloadState: DownloadStatus; // Phản ánh trạng thái của luồng preview hiện tại
    
    // Danh sách các bài hát trong Queue và Preview
    downloads: Map<string, DownloadItem>;
    previewItems: DownloadItem[];
    
    downloadError: string | null;
    duplicateInfo: DuplicateInfo;
    initiator: 'modal' | 'section' | null;
    playlistTitle: string | null;

    // Actions
    fetchInfo: (targetUrl?: string, source?: 'modal' | 'section', mode?: 'video' | 'playlist') => Promise<{ success: boolean; hasWarning: boolean; requiresChoice?: boolean }>;
    executeDownload: (forceDownload?: boolean) => Promise<boolean>;
    updateMetadata: (id: string, updatedData: Partial<DownloadItem>) => void;
    bulkUpdateMetadata: (updatedData: Partial<DownloadItem>) => void;
    resetDownload: () => void;
    cancelDownload: (id: string) => void;
    clearAbandoned: () => void;
    
    // Computed properties
    totalProgress: number;
    activeCount: number;

    // Authentication
    authRequired: boolean;
    isLoggedIn: boolean;
    handleLogin: () => Promise<boolean>;
    logout: () => Promise<void>;
}

export const DownloadContext = createContext<DownloadContextType | undefined>(undefined);
