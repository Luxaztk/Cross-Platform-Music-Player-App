import { useState, useCallback, useMemo } from 'react';
import { useSettings, useLanguage, useLibrary, useDownload } from '@hooks';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';
import { YOUTUBE_URL_REGEX, matchesSearch } from '../../utils';
import { applyDownloaderMockup, IS_DEBUG_DOWNLOADER } from '../../../../debug/downloaderMockups';

import { type UseDownloadSectionReturn } from './types';

export const useDownloadSection = (searchQuery: string): UseDownloadSectionReturn => {
    const { settings, updateSettings, selectDirectory, isSaving } = useSettings();
    const { t } = useLanguage();
    const { isSyncing, handleSyncLibrary } = useLibrary();
    let manager = useDownload();

    if (IS_DEBUG_DOWNLOADER) {
        manager = applyDownloaderMockup(manager);
    }

    const [showHistory, setShowHistory] = useState(false);

    const [showEditMetadata, setShowEditMetadata] = useState(false);
    const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);
    const [showBulkEdit, setShowBulkEdit] = useState(false);

    const isBusy = manager.downloadState === DOWNLOAD_STATUS.FETCHING || manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING;

    // Visibility logic
    const visibility = useMemo(() => {
        const showsPath = matchesSearch(t('settings.downloads.path'), searchQuery) || matchesSearch(t('settings.downloads.pathDesc'), searchQuery);
        const showsQuality = matchesSearch(t('settings.downloads.quality'), searchQuery) || matchesSearch(t('settings.downloads.qualityDesc'), searchQuery);
        const showsAutoImport = matchesSearch(t('settings.downloads.autoImport'), searchQuery) || matchesSearch(t('settings.downloads.autoImportDesc'), searchQuery);
        const showsMaintenance = matchesSearch(t('settings.downloads.maintenance'), searchQuery) || matchesSearch(t('settings.downloads.maintenanceDesc'), searchQuery);
        const showsDownloader = matchesSearch(t('downloader.title'), searchQuery) || matchesSearch(t('downloader.urlPlaceholder'), searchQuery);

        return { showsPath, showsQuality, showsAutoImport, showsMaintenance, showsDownloader };
    }, [t, searchQuery]);

    const handleSelectPath = useCallback(async () => {
        const path = await selectDirectory(t('settings.downloads.selectFolder'));
        if (path) {
            updateSettings({
                downloads: {
                    ...settings.downloads,
                    downloadPath: path,
                }
            });
        }
    }, [selectDirectory, t, updateSettings, settings.downloads]);

    const handleAddImportPath = useCallback(async () => {
        const path = await selectDirectory(t('settings.downloads.addImportFolder'));
        if (path && !settings.downloads.autoImportPaths.includes(path)) {
            updateSettings({
                downloads: {
                    ...settings.downloads,
                    autoImportPaths: [...settings.downloads.autoImportPaths, path],
                }
            });
        }
    }, [selectDirectory, t, updateSettings, settings.downloads]);

    const handleRemoveImportPath = useCallback((path: string) => {
        updateSettings({
            downloads: {
                ...settings.downloads,
                autoImportPaths: settings.downloads.autoImportPaths.filter((p: string) => p !== path),
            }
        });
    }, [updateSettings, settings.downloads]);

    const handleFetchAndDownload = useCallback(async () => {
        if (!manager.url.trim()) return;

        if (manager.downloadState === DOWNLOAD_STATUS.PREVIEW) {
            await manager.executeDownload(false);
            return;
        }

        const result = await manager.fetchInfo(manager.url, 'section');

        if (result && result.success && !result.hasWarning) {
            await manager.executeDownload(false);
        }
    }, [manager]);

    const handlePaste = useCallback(async () => {
        try {
            const text = (await navigator.clipboard.readText()).trim();
            if (text && YOUTUBE_URL_REGEX.test(text)) {
                manager.setUrl(text);
            }
        } catch (err) {
            console.error('Paste failed', err);
        }
    }, [manager]);

    const handleSyncLibraryAction = useCallback(async () => {
        await handleSyncLibrary();
    }, [handleSyncLibrary]);

    return {
        settings,
        updateSettings,
        manager,
        isSaving,
        t,
        uiState: {
            showHistory,
            showEditMetadata,
            editingItem,
            showBulkEdit,
            isBusy,
            isSyncing
        },
        visibility,
        actions: {
            setShowHistory,
            setShowEditMetadata,
            setEditingItem,
            setShowBulkEdit,
            handleSelectPath,
            handleAddImportPath,
            handleRemoveImportPath,
            handleFetchAndDownload,
            handlePaste,
            handleSyncLibrary: handleSyncLibraryAction
        }
    };
};
