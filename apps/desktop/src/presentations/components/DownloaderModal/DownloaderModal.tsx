import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Download, Edit2, Loader2, CheckCircle2, AlertCircle, Clipboard, ClipboardCheck } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { EditModal } from '@components';
import { useLanguage, useDownload } from '@hooks';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

// Import các UI Component vừa tách
import { DownloadPreviewCard, DuplicateWarningBanner } from '@components';

import './DownloaderModal.scss';

interface DownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloaderModal: React.FC<DownloaderModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  let manager = useDownload();

  // ==========================================
  // 🛠 DEBUG UI MODE (Dành cho việc căn chỉnh CSS)
  // Đổi `isDebugUI = true` để khóa cứng giao diện ở trạng thái DOWNLOADING
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
        ['4', { id: '4', title: 'Ghé Thăm ft JGKID, Kimmese', artist: 'Đen', album: 'KOBUKOVU', status: 'pending', progress: 0, thumbnail: 'https://i.ytimg.com/vi/mock4/hqdefault.jpg' }],
      ])
    } as any;
  }
  // ==========================================

  const [isPasted, setIsPasted] = useState(false);
  const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      if (manager.downloadState === DOWNLOAD_STATUS.SUCCESS || manager.downloadState === DOWNLOAD_STATUS.ERROR) {
        if (manager.initiator === 'modal') manager.resetDownload();
      }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, manager.downloadState]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBusy = manager.downloadState === DOWNLOAD_STATUS.FETCHING || manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING;

  const handleClose = () => {
    if (isBusy) return;
    if (manager.initiator !== 'section') {
      manager.clearAbandoned();
    }
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(text)) {
        manager.setUrl(text);
        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 2000);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const renderContent = () => {
    switch (manager.downloadState) {
      case DOWNLOAD_STATUS.IDLE:
        return (
          <div className="downloader-input-state">
            <div className="input-header">
              <Search size={ICON_SIZES.XXLARGE * 1.5} className="placeholder-icon" />
              <p>{t('downloader.urlPlaceholder')}</p>
            </div>
            <div className="input-group">
              <div className="url-input-wrapper">
                <input
                  ref={urlInputRef}
                  type="text"
                  value={manager.url}
                  onChange={(e) => manager.setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onKeyDown={(e) => e.key === 'Enter' && manager.fetchInfo(manager.url, 'modal')}
                />
                <button
                  type="button"
                  className={`paste-btn ${isPasted ? 'success' : ''}`}
                  onClick={handlePaste}
                >
                  {isPasted ? <ClipboardCheck size={ICON_SIZES.XSMALL} /> : <Clipboard size={ICON_SIZES.XSMALL} />}
                </button>
              </div>
              <button
                type="button"
                className="fetch-btn"
                onClick={() => manager.fetchInfo(manager.url, 'modal')}
                disabled={!manager.url.trim()}
              >
                {t('downloader.fetchInfo')}
              </button>
            </div>
          </div>
        );

      case DOWNLOAD_STATUS.FETCHING:
        return (
          <div className="downloader-loading-state">
            <Loader2 size={ICON_SIZES.XXLARGE * 1.5} className="spinning-icon" />
            <p>{t('downloader.searching')}</p>
          </div>
        );

      case DOWNLOAD_STATUS.PREVIEW:
        return (
          <div className="downloader-preview-state">
            <div className="preview-items-list">
              {manager.previewItems.map((item) => (
                <DownloadPreviewCard
                  key={item.id}
                  info={item}
                  onClick={() => setEditingItem(item)}
                />
              ))}
            </div>

            <DuplicateWarningBanner duplicateInfo={manager.duplicateInfo} />
          </div>
        );

      case DOWNLOAD_STATUS.DOWNLOADING:
      case DOWNLOAD_STATUS.SUCCESS:
      case DOWNLOAD_STATUS.ERROR:
        if (manager.authRequired) {
          return (
            <div className="downloader-auth-state">
              <AlertCircle size={ICON_SIZES.XXLARGE * 1.5} className="warning-icon" />
              <h3>{t('downloader.authRequiredTitle')}</h3>
              <p>{t('downloader.authRequiredDesc')}</p>
            </div>
          );
        }

        if (manager.downloads.size === 1) {
          const singleItem = Array.from(manager.downloads.values())[0];
          return (
            <div className="downloader-preview-state">
              <div className="preview-items-list">
                <DownloadPreviewCard info={singleItem} />
              </div>

              {manager.downloadState === DOWNLOAD_STATUS.SUCCESS && (
                <div className="downloader-status-state success" style={{ marginTop: '24px' }}>
                  <CheckCircle2 size={48} className="status-icon" />
                  <h3>{t('downloader.success')}</h3>
                </div>
              )}
              {manager.downloadState === DOWNLOAD_STATUS.ERROR && (
                <div className="downloader-status-state error" style={{ marginTop: '24px' }}>
                  <AlertCircle size={48} className="status-icon" />
                  <h3>{t('downloader.error')}</h3>
                  <p className="error-message">{manager.downloadError}</p>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="downloader-preview-state">
            <div className="preview-items-list">
              {Array.from(manager.downloads.values()).map((item) => (
                <DownloadPreviewCard key={item.id} info={item} />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (manager.authRequired) {
      return (
        <div className="modal-footer">
          <div className="action-buttons horizontal">
            <button type="button" className="secondary-btn" onClick={() => manager.resetDownload()}>
              {t('common.cancel')}
            </button>
            <button type="button" className="primary-btn" onClick={manager.handleLogin}>
              {t('downloader.loginNow')}
            </button>
          </div>
        </div>
      );
    }

    switch (manager.downloadState) {
      case DOWNLOAD_STATUS.PREVIEW:
        return (
          <div className="modal-footer">
            <div className="action-buttons">
              {manager.previewItems.length === 1 ? (
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => setEditingItem(manager.previewItems[0])}
                  title={t('common.edit')}
                >
                  <Edit2 size={ICON_SIZES.TINY} />
                </button>
              ) : (
                <button
                  type="button"
                  className="edit-btn bulk"
                  onClick={() => setShowBulkEdit(true)}
                  title={t('downloader.editAll', { count: manager.previewItems.length })}
                >
                  <Edit2 size={ICON_SIZES.TINY} />
                  <span>{t('downloader.editAll', { count: manager.previewItems.length })}</span>
                </button>
              )}

              <button
                type="button"
                className={`primary-btn ${manager.duplicateInfo.warning ? 'warning-btn' : ''}`}
                onClick={() => manager.executeDownload(!!manager.duplicateInfo.warning)}
              >
                <Download size={ICON_SIZES.TINY} />
                <span>{manager.previewItems.length > 1 ? t('downloader.downloadAll', { count: manager.previewItems.length }) : t('downloader.downloadNow')}</span>
              </button>
            </div>
          </div>
        );
      case DOWNLOAD_STATUS.SUCCESS:
        return (
          <div className="modal-footer">
            <div className="action-buttons horizontal">
              <button type="button" className="primary-btn" onClick={handleClose}>
                {t('common.close')}
              </button>
            </div>
          </div>
        );

      case DOWNLOAD_STATUS.ERROR:
        return (
          <div className="modal-footer">
            <div className="action-buttons horizontal">
              <button type="button" className="secondary-btn" onClick={() => manager.resetDownload()}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="downloader-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-title">
              <Download size={ICON_SIZES.MEDIUM} />
              <h2>{manager.playlistTitle || t('downloader.title')}</h2>
            </div>
            {!isBusy && (
              <button type="button" className="close-btn" onClick={handleClose} title={t('common.close')}>
                <X size={ICON_SIZES.MEDIUM} />
              </button>
            )}
          </div>

          <div className="modal-body">
            {renderContent()}
          </div>

          {renderFooter()}
        </div>
      </div>

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

      {showBulkEdit && (
        <EditModal
          isOpen={true}
          isBulk={true}
          type="song"
          data={{
            title: t('downloader.bulkEditTitle'),
            artist: manager.previewItems[0]?.artist || '',
            album: manager.playlistTitle || manager.previewItems[0]?.album || '',
            coverArt: '',
          } as any}
          onClose={() => setShowBulkEdit(false)}
          onSave={(data: any) => {
            // Chỉ lấy Artist và Album để áp dụng cho tất cả
            const bulkData: Partial<DownloadItem> = {};
            if (data.artist) bulkData.artist = data.artist;
            if (data.album) bulkData.album = data.album;
            manager.bulkUpdateMetadata(bulkData);
            setShowBulkEdit(false);
          }}
        />
      )}
    </>
  );
};
