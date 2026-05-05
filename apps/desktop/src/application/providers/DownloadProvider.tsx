import React, { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useNotification, useLibrary, useLanguage } from '@hooks';
import { getErrorMessage } from '@music/utils';
import { DOWNLOAD_STATUS, type DownloadItem, type DownloadStatus } from '@music/types';
import {
    DownloadContext,
    initialDuplicateInfo,
    type DuplicateInfo
} from '../hooks/DownloadContext';

export const DownloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { refreshLibrary, refreshPlaylists } = useLibrary();

    const [url, _setUrl] = useState('');
    const [downloadState, setDownloadState] = useState<DownloadStatus>(DOWNLOAD_STATUS.IDLE);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo>(initialDuplicateInfo);
    const [initiator, setInitiator] = useState<'modal' | 'section' | null>(null);
    const [playlistTitle, setPlaylistTitle] = useState<string | null>(null);

    // Danh sách các bài hát đang chờ tải hoặc đang tải
    const [downloads, setDownloads] = useState<Map<string, DownloadItem>>(new Map());
    // Danh sách các bài hát đang hiện preview (trước khi bấm Download)
    const [previewItems, setPreviewItems] = useState<DownloadItem[]>([]);

    const [authRequired, setAuthRequired] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const stateRef = useRef(downloadState);
    useEffect(() => {
        stateRef.current = downloadState;
    }, [downloadState]);

    useEffect(() => {
        const checkAuth = async () => {
            const status = await window.electronAPI.getYoutubeAuthStatus();
            setIsLoggedIn(status);
        };
        checkAuth();

        const unsubProgress = window.electronAPI.onDownloadProgress((data: { id: string; percent: number }) => {
            console.log('[DownloadProvider] Received progress:', data);
            setDownloads(prev => {
                const item = prev.get(data.id);
                if (item) {
                    const newMap = new Map(prev);
                    newMap.set(data.id, { ...item, progress: data.percent, status: DOWNLOAD_STATUS.DOWNLOADING });
                    return newMap;
                }
                return prev;
            });
        });

        const unsubAuth = window.electronAPI.onYoutubeAuthRequired((data: { url: string; id?: string }) => {
            console.warn('[DownloadProvider] YouTube Auth Required for:', data.url);
            setAuthRequired(true);
            setDownloadState(DOWNLOAD_STATUS.IDLE);
        });

        return () => {
            unsubProgress();
            unsubAuth();
        };
    }, []);

    const handleLogin = async () => {
        const success = await window.electronAPI.openYoutubeAuth();
        if (success) {
            setIsLoggedIn(true);
            setAuthRequired(false);
            showNotification('success', t('settings.youtube.loginSuccess'));
        }
        return success;
    };

    const logout = async () => {
        await window.electronAPI.logoutYoutube();
        setIsLoggedIn(false);
        showNotification('success', t('settings.youtube.logoutSuccess'));
    };

    // Theo dõi trạng thái hoàn thành của toàn bộ hàng đợi
    useEffect(() => {
        if (downloadState === DOWNLOAD_STATUS.DOWNLOADING && downloads.size > 0) {
            let allDone = true;
            let hasError = false;
            let hasSuccess = false;

            downloads.forEach(item => {
                if (item.status === DOWNLOAD_STATUS.PENDING || item.status === DOWNLOAD_STATUS.DOWNLOADING) {
                    allDone = false;
                }
                if (item.status === DOWNLOAD_STATUS.ERROR) {
                    if (item.error?.includes('AUTH_REQUIRED')) {
                        setAuthRequired(true);
                    }
                    hasError = true;
                }
                if (item.status === DOWNLOAD_STATUS.SUCCESS) hasSuccess = true;
            });

            if (allDone) {
                if (hasSuccess || (!hasSuccess && !hasError)) {
                    setDownloadState(DOWNLOAD_STATUS.SUCCESS);
                } else if (hasError) {
                    setDownloadError(t('downloader.error'));
                    setDownloadState(DOWNLOAD_STATUS.ERROR);
                }
            }
        }
    }, [downloads, downloadState, t]);

    const setUrl = React.useCallback((newUrl: string) => {
        if (newUrl === url) return;

        _setUrl(newUrl);
        if (!newUrl.trim()) {
            resetDownload();
            return;
        }

        // Chỉ reset nếu không phải đang lấy thông tin hoặc đang tải
        if (
            downloadState !== DOWNLOAD_STATUS.FETCHING && 
            downloadState !== DOWNLOAD_STATUS.DOWNLOADING
        ) {
            setDownloadState(DOWNLOAD_STATUS.IDLE);
            setDownloadError(null);
            setPreviewItems([]);
            setDownloads(new Map());
            setDuplicateInfo(initialDuplicateInfo);
            setInitiator(null);
            setAuthRequired(false);
            setPlaylistTitle(null);
        }
    }, [url, downloadState]);

    const fetchInfo = async (targetUrl?: string, source?: 'modal' | 'section') => {
        const fetchUrl = targetUrl || url;
        if (!fetchUrl.trim()) return { success: false, hasWarning: false };

        if (source) setInitiator(source);
        setUrl(fetchUrl);
        setDownloadState(DOWNLOAD_STATUS.FETCHING);
        setDownloadError(null);

        try {
            // Nhận diện playlist (có list= trong URL)
            const isPlaylist = fetchUrl.includes('list=');
            
            if (isPlaylist) {
                const result = await window.electronAPI.fetchPlaylistInfo(fetchUrl);
                if (!result.success || !result.items) {
                    if (result.error === 'AUTH_REQUIRED') {
                        setAuthRequired(true);
                        throw new Error(t('downloader.authRequired'));
                    }
                    throw new Error(result.error || t('downloader.error'));
                }
                
                const items: DownloadItem[] = result.items.map(info => ({
                    ...info,
                    url: `https://www.youtube.com/watch?v=${info.id}`,
                    status: DOWNLOAD_STATUS.PREVIEW,
                    progress: 0
                }));
                
                setPreviewItems(items);
                setPlaylistTitle(result.title || null);
                setDownloadState(DOWNLOAD_STATUS.PREVIEW);
                return { success: true, hasWarning: false };
            } else {
                const result = await window.electronAPI.fetchYtInfo(fetchUrl);
                if (!result.success || !result.info) {
                    if (result.error === 'AUTH_REQUIRED') {
                        setAuthRequired(true);
                        throw new Error(t('downloader.authRequired'));
                    }
                    throw new Error(result.error || t('downloader.error'));
                }

                const dupCheck = await window.electronAPI.checkDuplicate(
                    result.info.title, result.info.artist, fetchUrl, result.info.id
                );

                const hasWarning = !!(dupCheck.isDuplicate && dupCheck.existingSong);
                setPreviewItems([{
                    ...result.info,
                    url: fetchUrl,
                    status: DOWNLOAD_STATUS.PREVIEW,
                    progress: 0
                }]);
                setPlaylistTitle(null);
                
                setDuplicateInfo(hasWarning
                    ? { ...initialDuplicateInfo, warning: { title: dupCheck.existingSong!.title, artist: dupCheck.existingSong!.artist, reason: dupCheck.reason as string } }
                    : initialDuplicateInfo
                );
                setDownloadState(DOWNLOAD_STATUS.PREVIEW);
                return { success: true, hasWarning };
            }
        } catch (err) {
            const msg = getErrorMessage(err);
            setDownloadError(msg);
            setDownloadState(DOWNLOAD_STATUS.ERROR);
            if (msg !== t('downloader.authRequired')) {
                showNotification('error', msg);
            }
            return { success: false, hasWarning: false };
        }
    };

    const executeDownload = async (forceDownload = false) => {
        if (previewItems.length === 0 || (duplicateInfo.warning && !forceDownload)) return false;

        const newDownloads = new Map(downloads);
        const itemsToStart = [...previewItems];
        
        itemsToStart.forEach(item => {
            newDownloads.set(item.id, { ...item, status: DOWNLOAD_STATUS.PENDING });
        });
        
        setDownloads(newDownloads);
        setDownloadState(DOWNLOAD_STATUS.DOWNLOADING);
        setPreviewItems([]); // Chuyển sang queue nên xóa preview

        // Kích hoạt worker cho từng bài (Backend sẽ tự quản lý maxConcurrent 3)
        itemsToStart.forEach(async (item) => {
            try {
                const dlResult = await window.electronAPI.downloadYtAudio(item.id, item.url, item.title);
                if (!dlResult.success || !dlResult.filePath) {
                    if (dlResult.error?.includes('Sign in')) {
                         setAuthRequired(true);
                    }
                    throw new Error(dlResult.error);
                }

                await window.electronAPI.writeAudioMetadata(dlResult.filePath, {
                    title: item.title,
                    artist: item.artist,
                    album: item.album,
                    coverArt: item.thumbnail,
                    originId: item.id,
                    sourceUrl: item.url,
                });

                await window.electronAPI.importFromPath(dlResult.filePath, item.url, item.id);
                
                setDownloads(prev => {
                    const current = prev.get(item.id);
                    if (current) {
                        const nextMap = new Map(prev);
                        nextMap.set(item.id, { 
                            ...current, 
                            status: DOWNLOAD_STATUS.SUCCESS, 
                            progress: 100, 
                            downloadedPath: dlResult.filePath 
                        });
                        return nextMap;
                    }
                    return prev;
                });
                
                refreshLibrary();
                refreshPlaylists();
            } catch (err) {
                setDownloads(prev => {
                    const current = prev.get(item.id);
                    if (current) {
                        const nextMap = new Map(prev);
                        nextMap.set(item.id, { ...current, status: DOWNLOAD_STATUS.ERROR, error: getErrorMessage(err) });
                        return nextMap;
                    }
                    return prev;
                });
            }
        });

        showNotification('success', t('downloader.enqueued', { count: itemsToStart.length }));
        return true;
    };

    const updateMetadata = React.useCallback((id: string, updatedData: Partial<DownloadItem>) => {
        setPreviewItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
    }, []);

    const bulkUpdateMetadata = React.useCallback((updatedData: Partial<DownloadItem>) => {
        setPreviewItems(prev => prev.map(item => ({ ...item, ...updatedData })));
    }, []);

    const resetDownload = React.useCallback(() => {
        setDownloadState(DOWNLOAD_STATUS.IDLE);
        setDownloadError(null);
        _setUrl('');
        setPreviewItems([]);
        setDownloads(new Map());
        setDuplicateInfo(initialDuplicateInfo);
        setInitiator(null);
        setPlaylistTitle(null);
        setAuthRequired(false);
    }, []);

    const cancelDownload = (id: string) => {
        window.electronAPI.cancelDownload(id);
        setDownloads(prev => {
            const nextMap = new Map(prev);
            nextMap.delete(id);
            return nextMap;
        });
    };

    const clearAbandoned = () => {
        if (stateRef.current !== DOWNLOAD_STATUS.FETCHING && stateRef.current !== DOWNLOAD_STATUS.DOWNLOADING) {
            resetDownload();
        }
    };

    const totalProgress = useMemo(() => {
        if (downloads.size === 0) return 0;
        let sum = 0;
        downloads.forEach(item => sum += item.progress);
        return sum / downloads.size;
    }, [downloads]);

    const activeCount = useMemo(() => {
        let count = 0;
        downloads.forEach(item => {
            if (item.status === DOWNLOAD_STATUS.DOWNLOADING || item.status === DOWNLOAD_STATUS.PENDING) count++;
        });
        return count;
    }, [downloads]);

    return (
        <DownloadContext.Provider value={{
            url, setUrl, downloadState, downloadError,
            downloads, previewItems, duplicateInfo, initiator, playlistTitle,
            fetchInfo, executeDownload, updateMetadata, bulkUpdateMetadata, resetDownload, cancelDownload, clearAbandoned,
            totalProgress, activeCount,
            authRequired, isLoggedIn, handleLogin, logout
        }}>
            {children}
        </DownloadContext.Provider>
    );
};
