import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Download, Edit2, Loader2, CheckCircle2, AlertCircle, Clipboard, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { EditModal } from '@components';
import { useLanguage, useDownload } from '@hooks';

// Import các UI Component vừa tách
import { DownloadPreviewCard, DownloadProgressBar, DuplicateWarningBanner } from '@components';

import './DownloaderModal.scss';

interface DownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloaderModal: React.FC<DownloaderModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  // Gọi "Bộ não" (Global Hook)
  const manager = useDownload();

  // Local UI State (Chỉ phục vụ tương tác trên Modal này)
  const [isPasted, setIsPasted] = useState(false);
  const [showEditMetadata, setShowEditMetadata] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Smart Guard Effect: Tự động reset trạng thái cũ nếu modal được mở lại ở trạng thái rác
  useEffect(() => {
    if (isOpen) {
      const isStaleState = ['preview', 'success', 'error'].includes(manager.downloadState);
      const isModalInitiated = manager.initiator === 'modal';

      if (isStaleState && isModalInitiated) {
        // Sử dụng setTimeout để tránh "cascading render" đồng bộ
        const timer = setTimeout(() => {
          manager.resetDownload();
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, manager.downloadState, manager.initiator]);


  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
  }, [isOpen, manager]);

  if (!isOpen) return null;

  // Đã sửa: dùng downloadState thay cho status
  const isBusy = manager.downloadState === 'fetching' || manager.downloadState === 'downloading';

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(text)) {
        manager.setUrl(text);
        setIsPasted(true);
        // Tự động tắt feedback sau 2s
        setTimeout(() => setIsPasted(false), 2000);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const renderContent = () => {
    // Đã sửa: dùng downloadState
    switch (manager.downloadState) {
      case 'idle':
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
                  title={t('downloader.paste')}
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

      case 'fetching':
        return (
          <div className="downloader-loading-state">
            <Loader2 size={ICON_SIZES.XXLARGE * 1.5} className="spinning-icon" />
            <p>{t('downloader.searching')}</p>
          </div>
        );

      case 'preview':
        return (
          <div className="downloader-preview-state">
            {/* LẮP CƠ BẮP VÀO ĐÂY */}
            <DownloadPreviewCard info={manager.videoInfo} />
            <DuplicateWarningBanner duplicateInfo={manager.duplicateInfo} />

            <div className="action-buttons">
              <button type="button" className="edit-btn" onClick={() => setShowEditMetadata(true)} title={t('common.edit')}>
                <Edit2 size={ICON_SIZES.TINY} />
              </button>
              {manager.duplicateInfo.warning ? (
                <button type="button" className="primary-btn warning-btn" onClick={() => manager.executeDownload(true)}>
                  <Download size={ICON_SIZES.TINY} />
                  <span>{t('downloader.downloadAnyway')}</span>
                </button>
              ) : (
                <button type="button" className="primary-btn" onClick={() => manager.executeDownload(false)}>
                  <Download size={ICON_SIZES.TINY} />
                  <span>{t('downloader.downloadNow')}</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'downloading':
        return (
          <DownloadProgressBar
            progress={manager.downloadProgress} // Đã sửa
            title={manager.videoInfo?.title}
          />
        );

      case 'success':
        return (
          <div className="downloader-status-state success">
            <CheckCircle2 size={64} className="status-icon" />
            <h3>{t('downloader.success')}</h3>

            {/* Banner báo trùng lặp sau tải */}
            {manager.duplicateInfo.isAfterDownload && (
              <div className="duplicate-info-banner">
                <AlertTriangle size={ICON_SIZES.TINY} />
                <span>
                  {manager.duplicateInfo.reasonAfterDownload === 'HASH'
                    ? t('downloader.duplicateHashFound')
                    : t('downloader.duplicateSourceFound')}
                </span>
              </div>
            )}

            {manager.downloadedPath && (
              <div className="file-path-info">
                <span className="path-label">{t('downloader.savedTo')}</span>
                <span className="path-value">{manager.downloadedPath}</span>
              </div>
            )}
            <div className="action-buttons horizontal">
              {manager.downloadedPath && (
                <button type="button" className="secondary-btn" onClick={() => window.electronAPI.openItemPath(manager.downloadedPath!)}>
                  {t('downloader.openFolder')}
                </button>
              )}
              <button type="button" className="primary-btn" onClick={onClose}>
                {t('common.success')}
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="downloader-status-state error">
            <AlertCircle size={64} className="status-icon" />
            <h3>{t('downloader.error')}</h3>
            <p className="error-message">{manager.downloadError}</p>
            <button type="button" className="secondary-btn" onClick={() => manager.resetDownload()}>
              {t('common.cancel')}
            </button>
            <button type="button" className="primary-btn" onClick={() => manager.executeDownload()}>
              {t('downloader.downloadNow')}
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="downloader-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-title">
              <Download size={ICON_SIZES.MEDIUM} />
              <h2>{t('downloader.title')}</h2>
            </div>
            {!isBusy && (
              <button type="button" className="close-btn" onClick={onClose} title={t('common.close')}>
                <X size={ICON_SIZES.MEDIUM} />
              </button>
            )}
          </div>

          <div className="modal-body">
            {renderContent()}
          </div>
        </div>
      </div>

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
    </>
  );
};