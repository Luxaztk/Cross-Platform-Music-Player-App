import React, { useState } from 'react';
import { useSettings, useLanguage, useNotification, useLibrary, useDownload } from '@hooks';
import { ICON_SIZES } from '@constants';
import { Download, FolderOpen, Plus, Trash2, RefreshCcw, Search, Clipboard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomDropdown, CleanupResolutionModal } from '@components';
import { getErrorMessage } from '@music/utils';
import type { Song } from '@music/types';

interface DownloadSectionProps {
    searchQuery?: string;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ searchQuery }) => {
    const { settings, updateSettings, selectDirectory, isSaving } = useSettings();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const { refreshLibrary } = useLibrary();
    const {
        url, setUrl, isFetching, downloadState, downloadProgress, downloadError, startDownload
    } = useDownload();

    const [isScanning, setIsScanning] = useState(false);
    const [missingSongs, setMissingSongs] = useState<Song[] | null>(null);

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

    const handleScanLibrary = async () => {
        setIsScanning(true);
        try {
            const missing = await window.electronAPI.scanMissingFiles();
            if (missing.length === 0) {
                showNotification('info', t('libraryCleanup.noMissing'));
            } else {
                setMissingSongs(missing);
            }
        } catch (err) {
            showNotification('error', getErrorMessage(err));
        } finally {
            setIsScanning(false);
        }
    };

    const handleConfirmCleanup = async (selectedIds: string[]) => {
        if (!selectedIds.length) return;
        const count = selectedIds.length;
        try {
            const success = await window.electronAPI.deleteSongs(selectedIds);
            if (success) {
                showNotification('success', t('libraryCleanup.success').replace('{count}', count.toString()));
                await refreshLibrary();
            }
        } catch (err) {
            showNotification('error', getErrorMessage(err));
        } finally {
            setMissingSongs(null);
        }
    };

    const handleFetchAndDownload = async () => {
        await startDownload();
    };

    const handlePaste = async () => {
        try {
            const text = (await navigator.clipboard.readText()).trim();
            if (text && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(text)) {
                setUrl(text);
            }
        } catch (err) {
            console.error('Paste failed', err);
        }
    };

    return (
        <div className="settings-section">
            <CleanupResolutionModal
                isOpen={!!missingSongs}
                missingSongs={missingSongs || []}
                onClose={() => setMissingSongs(null)}
                onConfirm={handleConfirmCleanup}
            />
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
                            <button className="browse-btn" onClick={handleSelectPath} disabled={isSaving}>
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
                                <span className="badge-new">NEW</span>
                            </div>
                            <p>{t('downloader.urlPlaceholder')}</p>
                        </div>
                        <div className="downloader-quick-input">
                            <div className="input-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Paste YouTube link here..."
                                    disabled={isFetching}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFetchAndDownload()}
                                />
                                <button className="paste-icon-btn" onClick={handlePaste} title="Paste from clipboard">
                                    <Clipboard size={14} />
                                </button>
                            </div>
                            <button
                                className={`fetch-download-btn ${isFetching ? 'loading' : ''}`}
                                onClick={handleFetchAndDownload}
                                disabled={isFetching || !url.trim()}
                            >
                                {isFetching ? (
                                    <Loader2 size={16} className="spinning" />
                                ) : (
                                    <Download size={16} />
                                )}
                                <span>{isFetching ? t('downloader.downloading') : t('downloader.downloadNow')}</span>
                            </button>
                        </div>
                        {downloadState === 'downloading' && (
                            <div className="mini-progress-bar">
                                <div className="fill" style={{ width: `${downloadProgress}%` }} />
                                <span className="percent">{Math.round(downloadProgress)}%</span>
                            </div>
                        )}
                        {downloadState === 'success' && (
                            <div className="download-feedback success">
                                <CheckCircle2 size={14} />
                                <span>{t('downloader.success')}</span>
                            </div>
                        )}
                        {downloadState === 'error' && (
                            <div className="download-feedback error">
                                <AlertCircle size={14} />
                                <span>{downloadError}</span>
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
                                    <button onClick={() => handleRemoveImportPath(path)} title={t('settings.downloads.removeFolder')}>
                                        <Trash2 size={ICON_SIZES.TINY} />
                                    </button>
                                </div>
                            ))}
                            <button className="add-path-btn" onClick={handleAddImportPath} title={t('settings.downloads.addFolder')}>
                                <Plus size={ICON_SIZES.XSMALL} />
                                <span>{t('settings.downloads.addFolder')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Library Maintenance (Cleanup) */}
                {showsMaintenance && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <div className="with-badge">
                                <h3>{t('settings.downloads.maintenance')}</h3>
                                <span className="badge-system">{t('common.system')}</span>
                            </div>
                            <p>{t('settings.downloads.maintenanceDesc')}</p>
                        </div>
                        <div className="setting-control">
                            <button
                                className={`scan-btn ${isScanning ? 'busy' : ''}`}
                                onClick={handleScanLibrary}
                                disabled={isScanning}
                            >
                                <RefreshCcw size={ICON_SIZES.XSMALL} className={isScanning ? 'spinning' : ''} />
                                <span>{isScanning ? t('settings.downloads.scanning') : t('settings.downloads.scanNow')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
