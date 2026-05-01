import React, { useState } from 'react';
import { useSettings, useLanguage, useLibrary, useDownload } from '@hooks';
import { ICON_SIZES } from '@constants';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';
import { Download, FolderOpen, Plus, Trash2, RefreshCcw, Search, Clipboard, Loader2, History, Edit2, X, Video, LogOut, LogIn } from 'lucide-react';
import { CustomDropdown, DownloadPreviewCard, DuplicateWarningBanner, SyncHistoryModal, EditModal } from '@components';
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
    const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);
    const [showBulkEdit, setShowBulkEdit] = useState(false);

    // Global Hook
    let manager = useDownload();

    // ==========================================
    // 🛠 DEBUG UI MODE
    // ==========================================
    const isDebugUI = false;
    if (isDebugUI) {
        manager = {
            ...manager,
            downloadState: DOWNLOAD_STATUS.DOWNLOADING,
            playlistTitle: 'Playlist Nhạc Đen Vâu Mockup',
            activeCount: 2,
            totalProgress: 35,
            previewItems: [
                { id: '1', title: 'Mơ ft. Hậu Vi (Official Audio)', artist: 'Đen', album: 'KOBUKOVU', status: 'completed', progress: 100, thumbnail: 'https://i.ytimg.com/vi/mock1/hqdefault.jpg' },
                { id: '2', title: 'Cô Gái Bàn Bên ft Lynk Lee', artist: 'Đen', album: 'KOBUKOVU', status: 'downloading', progress: 45, thumbnail: 'https://i.ytimg.com/vi/mock2/hqdefault.jpg' },
                { id: '3', title: 'Mưa Trên Những Mái Tôn', artist: 'Đen', album: 'KOBUKOVU', status: 'pending', progress: 0, thumbnail: 'https://i.ytimg.com/vi/mock3/hqdefault.jpg' },
            ],
            downloads: new Map([
                ['1', { id: '1', title: 'Mơ ft. Hậu Vi (Official Audio)', artist: 'Đen', album: 'KOBUKOVU', status: 'completed', progress: 100, thumbnail: 'https://i.ytimg.com/vi/mock1/hqdefault.jpg' }],
                ['2', { id: '2', title: 'Cô Gái Bàn Bên ft Lynk Lee', artist: 'Đen', album: 'KOBUKOVU', status: 'downloading', progress: 45, thumbnail: 'https://i.ytimg.com/vi/mock2/hqdefault.jpg' }],
                ['3', { id: '3', title: 'Mưa Trên Những Mái Tôn', artist: 'Đen', album: 'KOBUKOVU', status: 'pending', progress: 0, thumbnail: 'https://i.ytimg.com/vi/mock3/hqdefault.jpg' }],
            ])
        } as any;
    }
    // ==========================================

    const isBusy = manager.downloadState === DOWNLOAD_STATUS.FETCHING || manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING;

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

        if (manager.downloadState === DOWNLOAD_STATUS.PREVIEW) {
            await manager.executeDownload(false);
            return;
        }

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
                                    disabled={manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING}
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
                                ) : manager.downloadState === DOWNLOAD_STATUS.PREVIEW ? (
                                    <Download size={16} />
                                ) : (
                                    <Search size={16} />
                                )}
                                <span>
                                    {manager.downloadState === DOWNLOAD_STATUS.FETCHING
                                        ? t('downloader.searching')
                                        : manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING
                                            ? t('downloader.downloading')
                                            : manager.downloadState === DOWNLOAD_STATUS.PREVIEW
                                                ? t('downloader.downloadNow')
                                                : t('downloader.fetchInfo')}
                                </span>
                            </button>
                        </div>

                        {manager.previewItems.length > 0 && (
                            <div className="downloader-result-area">
                                <div className="preview-items-list" style={{ maxHeight: '600px', overflowY: 'auto', marginBottom: '12px' }}>
                                    {manager.previewItems.map((item) => (
                                        <DownloadPreviewCard
                                            key={item.id}
                                            info={item}
                                            onClick={manager.downloadState === DOWNLOAD_STATUS.PREVIEW ? () => setEditingItem(item) : undefined}
                                            badgeCount={0}
                                        />
                                    ))}
                                </div>

                                {manager.downloadState === DOWNLOAD_STATUS.PREVIEW && manager.previewItems.length > 1 && (
                                    <div className="action-buttons horizontal" style={{ marginBottom: '12px' }}>
                                        <button
                                            type="button"
                                            className="edit-btn bulk"
                                            onClick={() => setShowBulkEdit(true)}
                                        >
                                            <Edit2 size={ICON_SIZES.TINY} />
                                            <span>{t('downloader.editAll', { count: manager.previewItems.length })}</span>
                                        </button>
                                    </div>
                                )}

                                {manager.downloadState === DOWNLOAD_STATUS.PREVIEW && (
                                    <DuplicateWarningBanner duplicateInfo={manager.duplicateInfo} />
                                )}

                                {manager.downloadState === DOWNLOAD_STATUS.PREVIEW && manager.duplicateInfo.warning && (
                                    <div className="action-buttons horizontal">
                                        <button type="button" className="secondary-btn" onClick={() => manager.resetDownload()}>
                                            {t('common.cancel')}
                                        </button>
                                        <button type="button" className="primary-btn warning-btn" onClick={() => manager.executeDownload(true)}>
                                            {t('downloader.downloadAnyway')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {manager.downloads.size > 0 && (
                            <div className="downloader-result-area">
                                <div className="queue-mini-monitor">
                                    <div className="monitor-header">
                                        <span
                                            className="monitor-title"
                                            title={manager.downloads.size === 1 ? Array.from(manager.downloads.values())[0].title : ''}
                                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '16px' }}
                                        >
                                            {manager.downloads.size === 1
                                                ? Array.from(manager.downloads.values())[0].title
                                                : t('downloader.downloadingCount', { count: manager.activeCount })}
                                        </span>
                                        <span>{Math.round(manager.totalProgress)}%</span>
                                    </div>
                                    <div className="monitor-bar">
                                        <div className="fill" style={{ width: `${manager.totalProgress}%` }} />
                                    </div>
                                    {manager.downloadState !== DOWNLOAD_STATUS.DOWNLOADING && manager.downloadState !== DOWNLOAD_STATUS.FETCHING && (
                                        <div className="monitor-actions">
                                            <button className="reset-link" onClick={() => manager.resetDownload()}>
                                                <X size={14} />
                                                <span>{t('common.clear')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* YouTube Account Authentication */}
                {showsDownloader && (
                    <div className="setting-item youtube-auth-item">
                        <div className="setting-info">
                            <div className="title-with-icon">
                                <Video size={ICON_SIZES.SMALL} color="#FF0000" />
                                <h3>{t('settings.youtube.title')}</h3>
                            </div>
                            <p>{manager.isLoggedIn ? t('settings.youtube.loggedInDesc') : t('settings.youtube.loggedOutDesc')}</p>
                        </div>
                        <div className="setting-control">
                            {manager.isLoggedIn ? (
                                <button type="button" className="secondary-btn logout-btn" onClick={manager.logout}>
                                    <LogOut size={ICON_SIZES.TINY} />
                                    <span>{t('settings.youtube.logout')}</span>
                                </button>
                            ) : (
                                <button type="button" className="primary-btn login-btn" onClick={manager.handleLogin}>
                                    <LogIn size={ICON_SIZES.TINY} />
                                    <span>{t('settings.youtube.login')}</span>
                                </button>
                            )}
                        </div>
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

            {editingItem && (
                <EditModal
                    isOpen={true}
                    type="song"
                    data={{
                        title: editingItem.title,
                        artist: editingItem.artist,
                        album: editingItem.album,
                        coverArt: editingItem.thumbnail,
                    } as any}
                    onClose={() => setEditingItem(null)}
                    onSave={(data: any) => {
                        manager.updateMetadata(editingItem.id, data);
                        setEditingItem(null);
                    }}
                />
            )}

            {(showBulkEdit || (showEditMetadata && manager.previewItems.length === 1)) && (
                <EditModal
                    isOpen={true}
                    isBulk={manager.previewItems.length > 1}
                    type="song"
                    data={manager.previewItems.length === 1 ? {
                        title: manager.previewItems[0].title,
                        artist: manager.previewItems[0].artist,
                        album: manager.previewItems[0].album,
                        coverArt: manager.previewItems[0].thumbnail,
                    } as any : {
                        title: t('downloader.bulkEditTitle'),
                        artist: manager.previewItems[0]?.artist || '',
                        album: manager.playlistTitle || manager.previewItems[0]?.album || '',
                        coverArt: '',
                    } as any}
                    onClose={() => {
                        setShowBulkEdit(false);
                        setShowEditMetadata(false);
                    }}
                    onSave={(data: any) => {
                        if (manager.previewItems.length === 1) {
                            manager.updateMetadata(manager.previewItems[0].id, data);
                        } else {
                            const bulkData: Partial<DownloadItem> = {};
                            if (data.artist) bulkData.artist = data.artist;
                            if (data.album) bulkData.album = data.album;
                            manager.bulkUpdateMetadata(bulkData);
                        }
                        setShowBulkEdit(false);
                        setShowEditMetadata(false);
                    }}
                />
            )}
        </div>
    );
};