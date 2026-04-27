import React, { useState } from 'react';
import { useSettings, useLanguage, useLibrary, useDownload } from '@hooks';
import { ICON_SIZES } from '@constants';
import { Download, FolderOpen, Plus, Trash2, RefreshCcw, Search, Clipboard, Loader2, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { CustomDropdown, DownloadPreviewCard, DuplicateWarningBanner, DownloadProgressBar, SyncHistoryModal } from '@components';

interface DownloadSectionProps {
    searchQuery?: string;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ searchQuery }) => {
    const { settings, updateSettings, selectDirectory, isSaving } = useSettings();
    const [showHistory, setShowHistory] = useState(false);
    const { t } = useLanguage();

    // Gọi Global Hook
    const manager = useDownload();
    const isBusy = manager.downloadState === 'fetching' || manager.downloadState === 'downloading';


    const { 
        isSyncing,
        handleSyncLibrary
    } = useLibrary();

    const matchesSearch = (text: string) => {
        if (!searchQuery) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const showsPath = matchesSearch(t('settings.downloads.path')) || matchesSearch(t('settings.downloads.pathDesc'));
    const showsQuality = matchesSearch(t('settings.downloads.quality')) || matchesSearch(t('settings.downloads.qualityDesc'));
    const showsAutoImport = matchesSearch(t('settings.downloads.autoImport')) || matchesSearch(t('settings.downloads.autoImportDesc'));
    const showsMaintenance = matchesSearch(t('settings.downloads.maintenance')) || matchesSearch(t('settings.downloads.maintenanceDesc'));
    const showsDownloader = matchesSearch(t('downloader.title')) || matchesSearch(t('downloader.urlPlaceholder'));

    if (searchQuery && !showsPath && !showsQuality && !showsAutoImport && !showsMaintenance && !showsDownloader) return null;

    const handleSelectPath = async () => {
        const path = await selectDirectory(t('settings.downloads.selectFolder'));
        if (path) {
            updateSettings({
                downloads: {
                    downloadPath: path,
                    autoImportPaths: settings.downloads.autoImportPaths,
                    bitrate: settings.downloads.bitrate
                }
            });
        }
    };

    const handleAddImportPath = async () => {
        const path = await selectDirectory(t('settings.downloads.addImportFolder'));
        if (path && !settings.downloads.autoImportPaths.includes(path)) {
            updateSettings({
                downloads: {
                    autoImportPaths: [...settings.downloads.autoImportPaths, path],
                    downloadPath: settings.downloads.downloadPath,
                    bitrate: settings.downloads.bitrate
                }
            });
        }
    };

    const handleRemoveImportPath = (path: string) => {
        updateSettings({
            downloads: {
                autoImportPaths: settings.downloads.autoImportPaths.filter((p: string) => p !== path),
                downloadPath: settings.downloads.downloadPath,
                bitrate: settings.downloads.bitrate
            }
        });
    };

    // LUỒNG 1-CLICK AN TOÀN (SAFE QUICK DOWNLOAD)
    const handleFetchAndDownload = async () => {
        if (!manager.url.trim()) return;

        // Bước 1: Lấy thông tin & Check trùng lặp
        const result = await manager.fetchInfo(manager.url, 'section');

        // Bước 2: Nếu thành công và KHÔNG có cảnh báo trùng -> Tự động tải tiếp
        if (result && result.success && !result.hasWarning) {
            await manager.executeDownload(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = (await navigator.clipboard.readText()).trim();
            if (text && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(text)) {
                manager.setUrl(text);
            }
        } catch (err) {
            console.error('Paste failed', err);
        }
    };


    return (
        <div className="settings-section">
            <div className="section-header">
                <Download size={ICON_SIZES.MEDIUM} />
                <h2>{t('settings.downloads.title')}</h2>
            </div>

            <div className="settings-group">
                {/* Download Path */}
                {showsPath && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>{t('settings.downloads.path')}</h3>
                            <p className="current-path-display" title={settings.downloads.downloadPath}>
                                {settings.downloads.downloadPath || t('settings.downloads.notSet')}
                            </p>
                        </div>
                        <div className="setting-control">
                            <button type="button" className="browse-btn" onClick={handleSelectPath} disabled={isSaving}>
                                <FolderOpen size={ICON_SIZES.XSMALL} />
                                <span>{t('settings.downloads.browse')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Online Downloader Quick Action (V4 PREMIUM) */}
                {showsDownloader && (
                    <div className="setting-item vertical online-downloader-item">
                        <div className="setting-info">
                            <div className="with-badge">
                                <h3>{t('downloader.title')}</h3>
                            </div>
                        </div>

                        <div className="downloader-quick-input">
                            <div className="input-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    value={manager.url}
                                    onChange={(e) => manager.setUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    disabled={manager.downloadState === 'downloading'}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFetchAndDownload()}
                                />
                                <button type="button" className="paste-icon-btn" onClick={handlePaste} title="Paste from clipboard">
                                    <Clipboard size={14} />
                                </button>
                            </div>
                            <button
                                type="button"
                                className={`fetch-download-btn ${isBusy ? 'loading' : ''}`}
                                onClick={handleFetchAndDownload}
                                disabled={isBusy || !manager.url.trim()}
                            >
                                {isBusy ? (
                                    <Loader2 size={16} className="spinning" />
                                ) : manager.downloadState === 'preview' ? (
                                    <Download size={16} />
                                ) : (
                                    <Search size={16} />
                                )}
                                <span>
                                    {manager.downloadState === 'fetching'
                                        ? t('downloader.searching')
                                        : manager.downloadState === 'downloading'
                                            ? t('downloader.downloading')
                                            : manager.downloadState === 'preview'
                                                ? t('downloader.downloadNow')
                                                : t('downloader.fetchInfo')}
                                </span>
                            </button>
                        </div>

                        {/* VISIBILITY PERSISTENCE AREA: Giữ Card bài hát không bị flash */}
                        {manager.videoInfo && (
                            <div className="downloader-result-area">
                                <DownloadPreviewCard info={manager.videoInfo} />

                                {/* Cảnh báo trùng lặp (Chỉ hiện ở trạng thái preview) */}
                                {manager.downloadState === 'preview' && (
                                    <DuplicateWarningBanner duplicateInfo={manager.duplicateInfo} />
                                )}

                                {/* Nếu có trùng lặp ở state preview, hiện thêm nút xác nhận thủ công */}
                                {manager.downloadState === 'preview' && manager.duplicateInfo.warning && (
                                    <div className="action-buttons horizontal">
                                        <button type="button" className="secondary-btn" onClick={() => manager.resetDownload()}>
                                            {t('common.cancel')}
                                        </button>
                                        <button type="button" className="primary-btn warning-btn" onClick={() => manager.executeDownload(true)}>
                                            {t('downloader.downloadAnyway')}
                                        </button>
                                    </div>
                                )}

                                {/* Progress Bar (Chỉ hiện ở trạng thái downloading) */}
                                {manager.downloadState === 'downloading' && (
                                    <DownloadProgressBar progress={manager.downloadProgress} />
                                )}

                                {/* Rich Success State (Thiết kế Inline nằm ngang) */}
                                {manager.downloadState === 'success' && (
                                    <div className="inline-success-banner">
                                        <div className="success-info">
                                            <CheckCircle2 size={18} className="success-icon" />
                                            <div className="text-details">
                                                <span className="status-title">{t('downloader.success')}</span>
                                                {manager.downloadedPath && (
                                                    <span className="file-path">{manager.downloadedPath}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="action-group">
                                            {manager.downloadedPath && (
                                                <button
                                                    type="button"
                                                    className="folder-btn"
                                                    onClick={() => window.electronAPI.openItemPath(manager.downloadedPath!)}
                                                    title={t('downloader.openFolder')}
                                                >
                                                    <FolderOpen size={18} />
                                                </button>
                                            )}
                                            <button type="button" className="done-btn" onClick={() => manager.resetDownload()}>
                                                {t('common.success')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {manager.downloadState === 'error' && (
                                    <div className="download-feedback error">
                                        <AlertCircle size={16} />
                                        <span>{manager.downloadError}</span>
                                        <button type="button" className="reset-link" onClick={() => manager.resetDownload()}>
                                            {t('common.cancel')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Bitrate Selection */}
                {showsQuality && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>{t('settings.downloads.quality')}</h3>
                            <p>{t('settings.downloads.qualityDesc')}</p>
                        </div>
                        <div className="setting-control">
                            <CustomDropdown
                                value={settings.downloads.bitrate}
                                onChange={(val) => updateSettings({
                                    downloads: {
                                        bitrate: String(val),
                                        downloadPath: settings.downloads.downloadPath,
                                        autoImportPaths: settings.downloads.autoImportPaths
                                    }
                                })}
                                options={[
                                    { value: '128', label: '128kbps (Standard)' },
                                    { value: '192', label: '192kbps (Medium)' },
                                    { value: '256', label: '256kbps (High)' },
                                    { value: '320', label: '320kbps (Best)' },
                                ]}
                                title={t('settings.downloads.qualitySelect')}
                            />
                        </div>
                    </div>
                )}

                {/* Auto Import Paths */}
                {showsAutoImport && (
                    <div className="setting-item vertical">
                        <div className="setting-info">
                            <h3>{t('settings.downloads.autoImport')}</h3>
                            <p>{t('settings.downloads.autoImportDesc')}</p>
                        </div>
                        <div className="import-paths-list">
                            {settings.downloads.autoImportPaths.map((path: string) => (
                                <div key={path} className="import-path-item">
                                    <span title={path}>{path}</span>
                                    <button type="button" onClick={() => handleRemoveImportPath(path)} title={t('settings.downloads.removeFolder')}>
                                        <Trash2 size={ICON_SIZES.TINY} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="add-path-btn" onClick={handleAddImportPath} title={t('settings.downloads.addFolder')}>
                                <Plus size={ICON_SIZES.XSMALL} />
                                <span>{t('settings.downloads.addFolder')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Background Sync Toggle */}
                {showsAutoImport && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>{t('settings.downloads.backgroundSync')}</h3>
                            <p>{t('settings.downloads.backgroundSyncDesc')}</p>
                        </div>
                        <div className="setting-control">
                            <CustomDropdown
                                value={settings.downloads.backgroundSync}
                                onChange={(val) => updateSettings({
                                    downloads: {
                                        ...settings.downloads,
                                        backgroundSync: Number(val)
                                    }
                                })}
                                options={[
                                    { value: 0, label: t('settings.downloads.syncInterval.never') },
                                    { value: 30, label: t('settings.downloads.syncInterval.min30') },
                                    { value: 60, label: t('settings.downloads.syncInterval.hour1') },
                                    { value: 120, label: t('settings.downloads.syncInterval.hour2') },
                                    { value: 360, label: t('settings.downloads.syncInterval.hour6') },
                                    { value: 1440, label: t('settings.downloads.syncInterval.day1') },
                                ]}
                                title={t('settings.downloads.backgroundSync')}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                )}

                {/* Library Maintenance (Cleanup) */}
                {showsMaintenance && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>{t('settings.downloads.maintenance')}</h3>
                            <p>{t('settings.downloads.maintenanceDesc')}</p>
                        </div>
                        <div className="setting-control maintenance-actions">
                            <button 
                                type="button"
                                className="history-btn" 
                                onClick={() => setShowHistory(true)} 
                                title={t('libraryCleanup.viewHistory')}
                            >
                                <History size={ICON_SIZES.XSMALL} />
                            </button>
                            <button
                                type="button"
                                className={`scan-btn ${isSyncing ? 'busy' : ''}`}
                                onClick={() => handleSyncLibrary()}
                                disabled={isSyncing}
                            >
                                <RefreshCcw size={ICON_SIZES.XSMALL} className={isSyncing ? 'spinning' : ''} />
                                <span>{isSyncing ? t('libraryCleanup.scanning') : t('libraryCleanup.scanNow')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SyncHistoryModal 
                isOpen={showHistory} 
                onClose={() => setShowHistory(false)} 
            />
        </div>
    );
};