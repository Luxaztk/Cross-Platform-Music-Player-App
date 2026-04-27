import React, { useState } from 'react';
import { useSettings, useLanguage, useLibrary, useDownload } from '@hooks';
import { ICON_SIZES } from '@constants';
import { Download, FolderOpen, Plus, Trash2, RefreshCcw, Search, Clipboard, Loader2, CheckCircle2, AlertCircle, History, Edit2 } from 'lucide-react';
import { CustomDropdown, DownloadPreviewCard, DuplicateWarningBanner, DownloadProgressBar, SyncHistoryModal, EditModal } from '@components';
import { 
    YOUTUBE_URL_REGEX, 
    BITRATE_OPTIONS, 
    getSyncIntervalOptions, 
    type DownloadSectionProps,
    matchesSearch
} from '../utils';

export const DownloadSection: React.FC<DownloadSectionProps> = ({ searchQuery }) => {
    const { settings, updateSettings, selectDirectory, isSaving } = useSettings();
    const [showHistory, setShowHistory] = useState(false);
    const { t } = useLanguage();
    const [showEditMetadata, setShowEditMetadata] = useState(false);

    // Global Hook
    const manager = useDownload();
    const isBusy = manager.downloadState === 'fetching' || manager.downloadState === 'downloading';

    const { 
        isSyncing,
        handleSyncLibrary
    } = useLibrary();

    const showsPath = matchesSearch(t('settings.downloads.path'), searchQuery) || matchesSearch(t('settings.downloads.pathDesc'), searchQuery);
    const showsQuality = matchesSearch(t('settings.downloads.quality'), searchQuery) || matchesSearch(t('settings.downloads.qualityDesc'), searchQuery);
    const showsAutoImport = matchesSearch(t('settings.downloads.autoImport'), searchQuery) || matchesSearch(t('settings.downloads.autoImportDesc'), searchQuery);
    const showsMaintenance = matchesSearch(t('settings.downloads.maintenance'), searchQuery) || matchesSearch(t('settings.downloads.maintenanceDesc'), searchQuery);
    const showsDownloader = matchesSearch(t('downloader.title'), searchQuery) || matchesSearch(t('downloader.urlPlaceholder'), searchQuery);

    if (searchQuery && !showsPath && !showsQuality && !showsAutoImport && !showsMaintenance && !showsDownloader) return null;

    const handleSelectPath = async () => {
        const path = await selectDirectory(t('settings.downloads.selectFolder'));
        if (path) {
            updateSettings({
                downloads: {
                    ...settings.downloads,
                    downloadPath: path,
                }
            });
        }
    };

    const handleAddImportPath = async () => {
        const path = await selectDirectory(t('settings.downloads.addImportFolder'));
        if (path && !settings.downloads.autoImportPaths.includes(path)) {
            updateSettings({
                downloads: {
                    ...settings.downloads,
                    autoImportPaths: [...settings.downloads.autoImportPaths, path],
                }
            });
        }
    };

    const handleRemoveImportPath = (path: string) => {
        updateSettings({
            downloads: {
                ...settings.downloads,
                autoImportPaths: settings.downloads.autoImportPaths.filter((p: string) => p !== path),
            }
        });
    };

    const handleFetchAndDownload = async () => {
        if (!manager.url.trim()) return;

        const result = await manager.fetchInfo(manager.url, 'section');

        if (result && result.success && !result.hasWarning) {
            await manager.executeDownload(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = (await navigator.clipboard.readText()).trim();
            if (text && YOUTUBE_URL_REGEX.test(text)) {
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

                {/* Online Downloader Quick Action */}
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
                                    placeholder={t('downloader.urlPlaceholder')}
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

                        {manager.videoInfo && (
                            <div className="downloader-result-area">
                                <div 
                                    className="preview-with-actions clickable" 
                                    onClick={() => manager.downloadState === 'preview' && setShowEditMetadata(true)}
                                    title={t('common.edit')}
                                >
                                    <DownloadPreviewCard info={manager.videoInfo} />
                                    <div className="edit-overlay">
                                        <div className="edit-pill">
                                            <Edit2 size={ICON_SIZES.TINY} />
                                            <span>{t('common.edit')}</span>
                                        </div>
                                    </div>
                                </div>

                                {manager.downloadState === 'preview' && (
                                    <DuplicateWarningBanner duplicateInfo={manager.duplicateInfo} />
                                )}

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

                                {manager.downloadState === 'downloading' && (
                                    <DownloadProgressBar progress={manager.downloadProgress} />
                                )}

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
                                        ...settings.downloads,
                                        bitrate: String(val),
                                    }
                                })}
                                options={BITRATE_OPTIONS}
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
                                options={getSyncIntervalOptions(t)}
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

            {showEditMetadata && manager.videoInfo && (
                <EditModal
                    isOpen={true}
                    type="song"
                    data={{
                        title: manager.videoInfo.title,
                        artist: manager.videoInfo.artist,
                        album: manager.videoInfo.album,
                        coverArt: manager.videoInfo.thumbnail,
                    } as any}
                    onClose={() => setShowEditMetadata(false)}
                    onSave={(data) => {
                        manager.updateMetadata(data);
                        setShowEditMetadata(false);
                    }}
                />
            )}
        </div>
    );
};