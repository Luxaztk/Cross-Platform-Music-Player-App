import React from 'react';
import { Download } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { SyncHistoryModal, EditModal } from '@components';
import { type DownloadItem, type Song } from '@music/types';
import { type DownloadSectionProps } from './types';
import { useDownloadSection } from './useDownloadSection';
import { PathSettings } from './components/PathSettings';
import { DownloaderTool } from './components/DownloaderTool';
import { YoutubeAuth } from './components/YoutubeAuth';
import { QualitySettings, BackgroundSyncSettings } from './components/QualitySettings';
import { MaintenanceSettings } from './components/MaintenanceSettings';
import { AutoImportSettings } from './components/AutoImportSettings';

export const DownloadSection: React.FC<DownloadSectionProps> = ({ searchQuery = '' }) => {
    const {
        settings,
        updateSettings,
        manager,
        isSaving,
        t,
        uiState,
        visibility,
        actions
    } = useDownloadSection(searchQuery);

    // If searching and nothing is visible, return null to hide the section entirely
    if (searchQuery && 
        !visibility.showsPath && 
        !visibility.showsQuality && 
        !visibility.showsAutoImport && 
        !visibility.showsMaintenance && 
        !visibility.showsDownloader
    ) {
        return null;
    }

    return (
        <div className="settings-section">
            <div className="section-header">
                <Download size={ICON_SIZES.MEDIUM} />
                <h2>{t('settings.downloads.title')}</h2>
            </div>

            <div className="settings-group">
                <PathSettings
                    isVisible={visibility.showsPath}
                    settings={settings}
                    updateSettings={updateSettings}
                    isSaving={isSaving}
                    onSelectPath={actions.handleSelectPath}
                    t={t}
                />

                <DownloaderTool
                    isVisible={visibility.showsDownloader}
                    manager={manager}
                    onFetch={actions.handleFetchAndDownload}
                    onPaste={actions.handlePaste}
                    onEditItem={actions.setEditingItem}
                    onBulkEdit={actions.setShowBulkEdit}
                    t={t}
                />

                <YoutubeAuth
                    isVisible={visibility.showsDownloader}
                    isLoggedIn={manager.isLoggedIn}
                    isExtractingCookies={manager.isExtractingCookies}
                    showLoginConfirmDialog={manager.showLoginConfirmDialog}
                    onLogin={manager.handleLogin}
                    onConfirmLogin={manager.handleConfirmLogin}
                    onCancelLoginDialog={manager.handleCancelLoginDialog}
                    onImportCookies={manager.handleImportCookieFile}
                    onLogout={manager.logout}
                    t={t}
                />

                <QualitySettings
                    isVisible={visibility.showsQuality}
                    bitrate={settings.downloads.bitrate}
                    onBitrateChange={(val) => updateSettings({
                        downloads: {
                            ...settings.downloads,
                            bitrate: String(val),
                        }
                    })}
                    t={t}
                />

                <AutoImportSettings
                    isVisible={visibility.showsAutoImport}
                    paths={settings.downloads.autoImportPaths}
                    onAdd={actions.handleAddImportPath}
                    onRemove={actions.handleRemoveImportPath}
                    t={t}
                />

                <BackgroundSyncSettings
                    isVisible={visibility.showsAutoImport}
                    value={settings.downloads.backgroundSync}
                    onChange={(val) => updateSettings({
                        downloads: {
                            ...settings.downloads,
                            backgroundSync: Number(val)
                        }
                    })}
                    isSaving={isSaving}
                    t={t}
                />

                <MaintenanceSettings
                    isVisible={visibility.showsMaintenance}
                    isSyncing={uiState.isSyncing}
                    onSync={actions.handleSyncLibrary}
                    onShowHistory={actions.setShowHistory}
                    t={t}
                />
            </div>

            <SyncHistoryModal
                isOpen={uiState.showHistory}
                onClose={() => actions.setShowHistory(false)}
            />

            {uiState.editingItem && (
                <EditModal
                    isOpen={true}
                    type="song"
                    data={{
                        title: uiState.editingItem.title,
                        artist: uiState.editingItem.artist,
                        album: uiState.editingItem.album,
                        coverArt: uiState.editingItem.thumbnail,
                    } as unknown as Song}
                    onClose={() => actions.setEditingItem(null)}
                    onSave={(data: Partial<DownloadItem>) => {
                        manager.updateMetadata(uiState.editingItem!.id, data);
                        actions.setEditingItem(null);
                    }}
                />
            )}

            {(uiState.showBulkEdit || (uiState.showEditMetadata && manager.previewItems.length === 1)) && (
                <EditModal
                    isOpen={true}
                    isBulk={manager.previewItems.length > 1}
                    type="song"
                    data={manager.previewItems.length === 1 ? ({
                        title: manager.previewItems[0].title,
                        artist: manager.previewItems[0].artist,
                        album: manager.previewItems[0].album,
                        coverArt: manager.previewItems[0].thumbnail,
                    } as unknown as Song) : ({
                        title: t('downloader.bulkEditTitle'),
                        artist: manager.previewItems[0]?.artist || '',
                        album: manager.playlistTitle || manager.previewItems[0]?.album || '',
                        coverArt: '',
                    } as unknown as Song)}
                    onClose={() => {
                        actions.setShowBulkEdit(false);
                        actions.setShowEditMetadata(false);
                    }}
                    onSave={(data: Partial<DownloadItem>) => {
                        if (manager.previewItems.length === 1) {
                            manager.updateMetadata(manager.previewItems[0].id, data);
                        } else {
                            const bulkData: Partial<DownloadItem> = {};
                            if (data.artist) bulkData.artist = data.artist;
                            if (data.album) bulkData.album = data.album;
                            manager.bulkUpdateMetadata(bulkData);
                        }
                        actions.setShowBulkEdit(false);
                        actions.setShowEditMetadata(false);
                    }}
                />
            )}
        </div>
    );
};
