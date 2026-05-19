import React from 'react';
import { Search, Clipboard, Loader2, Download, Edit2, Folder } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { DOWNLOAD_STATUS } from '@music/types';
import { DownloadPreviewCard, DuplicateWarningBanner } from '@components';
import { type DownloaderToolProps } from '../types';

export const DownloaderTool: React.FC<DownloaderToolProps> = ({
    isVisible,
    manager,
    onFetch,
    onPaste,
    onEditItem,
    onBulkEdit,
    t
}) => {
    if (!isVisible) return null;

    const isBusy = manager.downloadState === DOWNLOAD_STATUS.FETCHING || manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING;
    const hideDownloadBtn = manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING || 
                            manager.downloadState === DOWNLOAD_STATUS.SUCCESS || 
                            manager.downloadState === DOWNLOAD_STATUS.ERROR;

    return (
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
                        onKeyDown={(e) => e.key === 'Enter' && onFetch()}
                    />
                    <button type="button" className="paste-icon-btn" onClick={onPaste} title={t('downloader.paste')}>
                        <Clipboard size={14} />
                    </button>
                </div>
                <button
                    type="button"
                    className={`fetch-download-btn ${isBusy ? 'loading' : ''}`}
                    style={hideDownloadBtn ? { display: 'none' } : undefined}
                    onClick={onFetch}
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
                                onClick={manager.downloadState === DOWNLOAD_STATUS.PREVIEW ? () => onEditItem(item) : undefined}
                                badgeCount={0}
                            />
                        ))}
                    </div>

                    {manager.downloadState === DOWNLOAD_STATUS.PREVIEW && manager.previewItems.length > 1 && (
                        <div className="action-buttons horizontal" style={{ marginBottom: '12px' }}>
                            <button
                                type="button"
                                className="edit-btn bulk"
                                onClick={() => onBulkEdit(true)}
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
                    <div className="preview-items-list" style={{ marginBottom: '12px' }}>
                        {Array.from(manager.downloads.values()).map((item) => (
                            <DownloadPreviewCard
                                key={item.id}
                                info={item}
                                badgeCount={0}
                            />
                        ))}
                    </div>

                    {manager.downloads.size === 1 ? (
                        <div className="single-download-monitor">
                            {manager.downloadState !== DOWNLOAD_STATUS.DOWNLOADING && manager.downloadState !== DOWNLOAD_STATUS.FETCHING && (
                                <div className="action-buttons horizontal" style={{ marginTop: '12px', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button 
                                        type="button" 
                                        className="secondary-btn" 
                                        onClick={() => window.electronAPI.openDownloadsFolder()}
                                        title={t('common.openFolder', 'Mở thư mục')}
                                        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Folder size={16} />
                                        <span>{t('common.openFolder', 'Mở thư mục')}</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        className="primary-btn" 
                                        onClick={() => manager.resetDownload()}
                                    >
                                        {t('common.done', 'Hoàn tất')}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="queue-mini-monitor">
                            <div className="monitor-header">
                                <span
                                    className="monitor-title"
                                    title={t('downloader.downloadingCount', { count: manager.downloads.size })}
                                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '16px' }}
                                >
                                    {t('downloader.downloadingCount', { count: manager.downloads.size })}
                                </span>
                                <span>{Math.round(manager.totalProgress)}%</span>
                            </div>
                            <div className="monitor-bar">
                                <div className="fill" style={{ width: `${manager.totalProgress}%` }} />
                            </div>
                            {manager.downloadState !== DOWNLOAD_STATUS.DOWNLOADING && manager.downloadState !== DOWNLOAD_STATUS.FETCHING && (
                                <div className="action-buttons horizontal" style={{ marginTop: '12px', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button 
                                        type="button" 
                                        className="secondary-btn" 
                                        onClick={() => window.electronAPI.openDownloadsFolder()}
                                        title={t('common.openFolder', 'Mở thư mục')}
                                        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Folder size={16} />
                                        <span>{t('common.openFolder', 'Mở thư mục')}</span>
                                    </button>
                                    <button 
                                        type="button" 
                                        className="primary-btn" 
                                        onClick={() => manager.resetDownload()}
                                    >
                                        {t('common.done', 'Hoàn tất')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
