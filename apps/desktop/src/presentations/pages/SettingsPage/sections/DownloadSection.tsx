import React, { useState } from 'react';
import { useSettings, useLanguage } from '@hooks';
import { Download, FolderOpen, Plus, Trash2, RefreshCcw } from 'lucide-react';
import { CustomDropdown } from '@components';

interface DownloadSectionProps {
    searchQuery?: string;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ searchQuery }) => {
    const { settings, updateSettings, selectDirectory, isSaving } = useSettings();
    const { t } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);

    const matchesSearch = (text: string) => {
        if (!searchQuery) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const showsPath = matchesSearch(t('settings.downloads.path')) || matchesSearch(t('settings.downloads.pathDesc'));
    const showsQuality = matchesSearch(t('settings.downloads.quality')) || matchesSearch(t('settings.downloads.qualityDesc'));
    const showsAutoImport = matchesSearch(t('settings.downloads.autoImport')) || matchesSearch(t('settings.downloads.autoImportDesc'));
    const showsMaintenance = matchesSearch(t('settings.downloads.maintenance')) || matchesSearch(t('settings.downloads.maintenanceDesc'));

    if (searchQuery && !showsPath && !showsQuality && !showsAutoImport && !showsMaintenance) return null;

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
            await window.electronAPI.scanMissingFiles();
            // Optional: trigger library refresh here if needed
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="section-header">
                <Download size={20} />
                <h2>{t('settings.downloads.title')}</h2>
            </div>

            <div className="settings-group">
                {/* Download Path */}
                {showsPath && (
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>{t('settings.downloads.path')}</h3>
                            <p>{t('settings.downloads.pathDesc')}</p>
                        </div>
                        <div className="setting-control path-selector">
                            <input type="text" readOnly value={settings.downloads.downloadPath} title={t('settings.downloads.path')} />
                            <button onClick={handleSelectPath} disabled={isSaving}>
                                <FolderOpen size={16} />
                                <span>{t('settings.downloads.browse')}</span>
                            </button>
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
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button className="add-path-btn" onClick={handleAddImportPath} title={t('settings.downloads.addFolder')}>
                                <Plus size={16} />
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
                                <RefreshCcw size={16} className={isScanning ? 'spinning' : ''} />
                                <span>{isScanning ? t('settings.downloads.scanning') : t('settings.downloads.scanNow')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
