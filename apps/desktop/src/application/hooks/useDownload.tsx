import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNotification, useLibrary, useLanguage } from '@hooks';
import { getErrorMessage } from '@music/utils';

export type DownloadState = 'idle' | 'fetching' | 'downloading' | 'success' | 'error';

interface DownloadContextType {
    url: string;
    setUrl: (url: string) => void;
    isFetching: boolean;
    downloadState: DownloadState;
    downloadProgress: number;
    downloadError: string | null;
    startDownload: (targetUrl?: string) => Promise<void>;
    resetDownload: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const DownloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { refreshLibrary, refreshPlaylists } = useLibrary();

    const [url, setUrl] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [downloadState, setDownloadState] = useState<DownloadState>('idle');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    // Global listener for download progress
    useEffect(() => {
        const unsubscribe = window.electronAPI.onDownloadProgress((data) => {
            // Only update progress if the URL matches the one we are tracking
            // or if we want to show any active download (for now we track one at a time in UI)
            if (url && data.url === url) {
                setDownloadProgress(data.percent);
            }
        });
        return () => unsubscribe();
    }, [url]);

    const startDownload = async (targetUrl?: string) => {
        const downloadUrl = targetUrl || url;
        if (!downloadUrl.trim()) return;

        setIsFetching(true);
        setDownloadState('fetching');
        setDownloadError(null);
        setDownloadProgress(0);

        try {
            const infoResult = await window.electronAPI.fetchYtInfo(downloadUrl);
            if (!infoResult.success || !infoResult.info) {
                throw new Error(infoResult.error || t('downloader.error'));
            }

            const videoInfo = infoResult.info;
            setDownloadState('downloading');

            const dlResult = await window.electronAPI.downloadYtAudio(downloadUrl, videoInfo.title);

            if (!dlResult.success || !dlResult.filePath) {
                throw new Error(dlResult.error || t('downloader.error'));
            }

            await window.electronAPI.writeAudioMetadata(dlResult.filePath, {
                title: videoInfo.title,
                artist: videoInfo.artist,
                album: videoInfo.album,
                coverArt: videoInfo.thumbnail,
                originId: videoInfo.id,
                sourceUrl: downloadUrl,
            });

            await window.electronAPI.importFromPath(dlResult.filePath, downloadUrl, videoInfo.id);

            await Promise.all([refreshLibrary(), refreshPlaylists()]);
            setDownloadState('success');
            // We keep the URL for a while or clear it
            showNotification('success', t('downloader.success'));
        } catch (err) {
            const msg = getErrorMessage(err);
            setDownloadError(msg);
            setDownloadState('error');
            showNotification('error', msg);
        } finally {
            setIsFetching(false);
        }
    };

    const resetDownload = () => {
        setDownloadState('idle');
        setDownloadProgress(0);
        setDownloadError(null);
        setUrl('');
    };

    return (
        <DownloadContext.Provider value={{
            url, setUrl, isFetching, downloadState, downloadProgress, downloadError, startDownload, resetDownload
        }}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownload = () => {
    const context = useContext(DownloadContext);
    if (!context) {
        throw new Error('useDownload must be used within a DownloadProvider');
    }
    return context;
};
