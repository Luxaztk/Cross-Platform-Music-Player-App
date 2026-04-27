import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNotification, useLibrary, useLanguage } from '@hooks';
import { getErrorMessage } from '@music/utils';
import {
    DownloadContext,
    initialDuplicateInfo,
    type DuplicateInfo,
    type DownloadState,
    type YouTubeVideoInfo
} from '@hooks';

export const DownloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { refreshLibrary, refreshPlaylists } = useLibrary();

    const [url, _setUrl] = useState('');

    const setUrl = (newUrl: string) => {
        _setUrl(newUrl);
        if (!newUrl.trim()) {
            resetDownload();
        }
    };

    const [downloadState, setDownloadState] = useState<DownloadState>('idle');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo>(initialDuplicateInfo);
    const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
    const [initiator, setInitiator] = useState<'modal' | 'section' | null>(null);

    const stateRef = useRef(downloadState);
    useEffect(() => {
        stateRef.current = downloadState;
    }, [downloadState]);

    useEffect(() => {
        const unsubscribe = window.electronAPI.onDownloadProgress((data) => {
            if (url && data.url === url && downloadState === 'downloading') {
                setDownloadProgress(data.percent);
            }
        });
        return () => unsubscribe();
    }, [url, downloadState]);

    const fetchInfo = async (targetUrl?: string, source?: 'modal' | 'section') => {
        const fetchUrl = targetUrl || url;
        if (!fetchUrl.trim()) return { success: false, hasWarning: false };

        if (source) setInitiator(source);
        setUrl(fetchUrl);
        setDownloadState('fetching');
        setDownloadError(null);

        try {
            const result = await window.electronAPI.fetchYtInfo(fetchUrl);
            if (!result.success || !result.info) {
                throw new Error(result.error || t('downloader.error'));
            }

            const dupCheck = await window.electronAPI.checkDuplicate(
                result.info.title, result.info.artist, fetchUrl, result.info.id
            );

            const hasWarning = !!(dupCheck.isDuplicate && dupCheck.existingSong);
            setVideoInfo(result.info);
            setDuplicateInfo(hasWarning
                ? { ...initialDuplicateInfo, warning: { title: dupCheck.existingSong!.title, artist: dupCheck.existingSong!.artist, reason: dupCheck.reason as string } }
                : initialDuplicateInfo
            );
            setDownloadState('preview');
            return { success: true, hasWarning };
        } catch (err) {
            const msg = getErrorMessage(err);
            setDownloadError(msg);
            setDownloadState('error');
            showNotification('error', msg);
            return { success: false, hasWarning: false };
        }
    };

    const executeDownload = async (forceDownload = false) => {
        if (!videoInfo || (duplicateInfo.warning && !forceDownload)) return false;

        setDownloadState('downloading');
        setDownloadProgress(0);
        setDownloadError(null);

        try {
            const dlResult = await window.electronAPI.downloadYtAudio(url, videoInfo.title);
            if (!dlResult.success || !dlResult.filePath) {
                throw new Error(dlResult.error || t('downloader.error'));
            }

            await window.electronAPI.writeAudioMetadata(dlResult.filePath, {
                title: videoInfo.title,
                artist: videoInfo.artist,
                album: videoInfo.album,
                coverArt: videoInfo.thumbnail,
                originId: videoInfo.id,
                sourceUrl: url,
            });

            const importResult = await window.electronAPI.importFromPath(dlResult.filePath, url, videoInfo.id);

            await Promise.all([refreshLibrary(), refreshPlaylists()]);
            setDownloadedPath(dlResult.filePath);
            setDuplicateInfo(prev => ({
                ...prev,
                isAfterDownload: importResult.success && importResult.count === 0,
                reasonAfterDownload: importResult.reason || null
            }));

            setDownloadState('success');
            showNotification('success', t('downloader.success'));
            return true;
        } catch (err) {
            const msg = getErrorMessage(err);
            setDownloadError(msg);
            setDownloadState('error');
            showNotification('error', msg);
            return false;
        }
    };

    const updateMetadata = (updatedData: Partial<YouTubeVideoInfo>) => {
        setVideoInfo(prev => prev ? { ...prev, ...updatedData } : null);
    };

    const resetDownload = () => {
        setDownloadState('idle');
        setDownloadProgress(0);
        setDownloadError(null);
        _setUrl('');
        setVideoInfo(null);
        setDownloadedPath(null);
        setDuplicateInfo(initialDuplicateInfo);
        setInitiator(null);
    };

    const clearAbandoned = () => {
        if (stateRef.current !== 'fetching' && stateRef.current !== 'downloading') {
            resetDownload();
        }
    };

    return (
        <DownloadContext.Provider value={{
            url, setUrl, downloadState, setDownloadState, downloadProgress, downloadError,
            videoInfo, duplicateInfo, downloadedPath, initiator,
            fetchInfo, executeDownload, updateMetadata, resetDownload, clearAbandoned
        }}>
            {children}
        </DownloadContext.Provider>
    );
};
