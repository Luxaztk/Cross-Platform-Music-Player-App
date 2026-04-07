import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Download, Edit2, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Clipboard, ClipboardCheck } from 'lucide-react';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import { useLibrary, useNotification } from '../../../application/hooks';
import { EditModal } from '../EditModal/EditModal';
import './DownloaderModal.scss';

interface DownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'fetching' | 'preview' | 'downloading' | 'success' | 'error';

export const DownloaderModal: React.FC<DownloaderModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { refreshLibrary, refreshPlaylists } = useLibrary();
  const { showNotification } = useNotification();

  const [state, setState] = useState<ModalState>('input');
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isPasted, setIsPasted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditMetadata, setShowEditMetadata] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);

  // Duplicate check states
  const [duplicateWarning, setDuplicateWarning] = useState<{ title: string; artist: string; reason?: string } | null>(null);
  const [isDuplicateAfterDownload, setIsDuplicateAfterDownload] = useState(false);
  const [duplicateReasonAfterDownload, setDuplicateReasonAfterDownload] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setState('input');
      setUrl('');
      setError(null);
      setProgress(0);
      setVideoInfo(null);
      setDownloadedPath(null);
      setDuplicateWarning(null);
      setIsDuplicateAfterDownload(false);
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (state === 'downloading') {
      const unsubscribe = window.electronAPI.onDownloadProgress((data: any) => {
        if (data.url === url) {
          setProgress(data.percent);
        }
      });
      return () => unsubscribe();
    }
  }, [state, url]);

  if (!isOpen) return null;

  const isBusy = state === 'fetching' || state === 'downloading';

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleFetchInfo = async () => {
    if (!url.trim()) return;

    setState('fetching');
    setError(null);
    setDuplicateWarning(null);

    try {
      const result = await window.electronAPI.fetchYtInfo(url);
      if (result.success && result.info) {
        setVideoInfo(result.info);

        const dupCheck = await window.electronAPI.checkDuplicate(
          result.info.title, 
          result.info.artist, 
          url.trim(),
          result.info.id
        );
        if (dupCheck.isDuplicate && dupCheck.existingSong) {
          setDuplicateWarning({
            title: dupCheck.existingSong.title,
            artist: dupCheck.existingSong.artist,
            reason: dupCheck.reason,
          });
        }

        setState('preview');
      } else {
        setError(result.error || t('downloader.error'));
        setState('error');
      }
    } catch (err: any) {
      setError(err.message || t('downloader.error'));
      setState('error');
    }
  };

  const handleDownload = async (forceDownload = false) => {
    if (!videoInfo) return;

    // If duplicate warning is shown and user hasn't confirmed yet, stop here
    if (duplicateWarning && !forceDownload) return;

    setState('downloading');
    setProgress(0);
    setDuplicateWarning(null);

    try {
      const result = await window.electronAPI.downloadYtAudio(url, videoInfo.title);
      if (result.success && result.filePath) {
        // Write ID3 metadata to the downloaded file
        await window.electronAPI.writeAudioMetadata(result.filePath, {
          title: videoInfo.title,
          artist: videoInfo.artist,
          album: videoInfo.album,
          coverUrl: videoInfo.thumbnail,
          originId: videoInfo.id,
          sourceUrl: url,
        });

        // === CHỐT CHẶN 2: Import vào thư viện và kiểm tra trùng SAU khi tải ===
        const importResult = await window.electronAPI.importFromPath(result.filePath, url, videoInfo.id);

        if (importResult.success) {
          // count = 0 means the file was a duplicate and was NOT added
          if (importResult.count === 0) {
            setIsDuplicateAfterDownload(true);
            setDuplicateReasonAfterDownload(importResult.reason || null);
            // File cleanup is handled by the backend (library:importFromPath)
          }
          // Regardless, refresh to show latest library state
          await refreshLibrary();
          await refreshPlaylists();
        }

        setDownloadedPath(result.filePath);
        setState('success');
      } else {
        setError(result.error || t('downloader.error'));
        setState('error');
      }
    } catch (err: any) {
      setError(err.message || t('downloader.error'));
      setState('error');
    }
  };

  const handleUpdateMetadata = (updatedData: any) => {
    const updated = { ...videoInfo, ...updatedData };
    setVideoInfo(updated);
    setShowEditMetadata(false);

    // Re-check duplicate if title/artist changed
    window.electronAPI.checkDuplicate(updated.title, updated.artist, url, videoInfo.id).then((dupCheck) => {
      if (dupCheck.isDuplicate && dupCheck.existingSong) {
        setDuplicateWarning({
          title: dupCheck.existingSong.title,
          artist: dupCheck.existingSong.artist,
          reason: dupCheck.reason,
        });
      } else {
        setDuplicateWarning(null);
      }
    });
  };

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;

      const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(text);

      if (isYouTube) {
        setUrl(text);
        urlInputRef.current?.focus();
        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 2000);
      } else {
        showNotification('error', t('downloader.invalidUrl'));
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'input':
        return (
          <div className="downloader-input-state">
            <div className="input-header">
              <Search size={48} className="placeholder-icon" />
              <p>{t('downloader.urlPlaceholder')}</p>
            </div>
            <div className="input-group">
              <div className="url-input-wrapper">
                <input
                  ref={urlInputRef}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchInfo()}
                />
                <button 
                  className={`paste-btn ${isPasted ? 'success' : ''}`} 
                  onClick={handlePaste} 
                  title={t('downloader.paste')}
                >
                  {isPasted ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                </button>
              </div>
              <button
                className="fetch-btn"
                onClick={handleFetchInfo}
                disabled={!url.trim()}
              >
                {t('downloader.fetchInfo')}
              </button>
            </div>
          </div>
        );

      case 'fetching':
        return (
          <div className="downloader-loading-state">
            <Loader2 size={48} className="spinning-icon" />
            <p>{t('downloader.searching')}</p>
          </div>
        );

      case 'preview':
        return (
          <div className="downloader-preview-state">
            <div className="video-card">
              <div className="thumbnail-container">
                <img src={videoInfo.thumbnail} alt={videoInfo.title} />
              </div>
              <div className="video-details">
                <h3>{videoInfo.title}</h3>
                <p>{videoInfo.artist}</p>
                <span className="album-tag">{videoInfo.album}</span>
              </div>
            </div>

            {/* === HIỂN THỊ CẢNH BÁO TRÙNG LẶP (Chốt 1) === */}
            {duplicateWarning && (
              <div className="duplicate-warning">
                <AlertTriangle size={16} />
                <div>
                  <strong>{t('downloader.duplicateWarning')}</strong>
                  <p>
                  {duplicateWarning.reason === 'URL' 
                    ? t('downloader.duplicateSourceFound') 
                    : t('downloader.duplicateFound')
                      .replace('{title}', duplicateWarning.title)
                      .replace('{artist}', duplicateWarning.artist)}
                  </p>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button className="secondary-btn" onClick={() => setShowEditMetadata(true)}>
                <Edit2 size={ICON_SIZES.TINY} />
                <span>{t('downloader.editMetadata')}</span>
              </button>
              {duplicateWarning ? (
                <button className="primary-btn warning-btn" onClick={() => handleDownload(true)}>
                  <Download size={ICON_SIZES.TINY} />
                  <span>{t('downloader.downloadAnyway')}</span>
                </button>
              ) : (
                <button className="primary-btn" onClick={() => handleDownload(false)}>
                  <Download size={ICON_SIZES.TINY} />
                  <span>{t('downloader.downloadNow')}</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'downloading':
        const isConverting = progress >= 99.9;
        return (
          <div className="downloader-progress-state">
            <div className="progress-info">
              <p>{isConverting ? t('downloader.converting') : t('downloader.downloading')}</p>
              <span className="percent">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%`, transition: isConverting ? 'none' : 'width 0.3s ease' }}
              />
            </div>
            <p className="song-title-scrolling">{videoInfo.title}</p>
          </div>
        );

      case 'success':
        return (
          <div className="downloader-status-state success">
            <CheckCircle2 size={64} className="status-icon" />
            <h3>{t('downloader.success')}</h3>

            {/* Thông báo nếu bị trùng sau khi tải (Chốt 2) */}
            {isDuplicateAfterDownload && (
              <div className="duplicate-info-banner">
                <AlertTriangle size={14} />
                <span>
                  {duplicateReasonAfterDownload === 'HASH' 
                    ? t('downloader.duplicateHashFound')
                    : t('downloader.duplicateSourceFound')}
                </span>
              </div>
            )}

            {downloadedPath && (
              <div className="file-path-info">
                <span className="path-label">{t('downloader.savedTo')}</span>
                <span className="path-value">{downloadedPath}</span>
              </div>
            )}
            <div className="action-buttons horizontal">
              {downloadedPath && (
                <button className="secondary-btn" onClick={() => window.electronAPI.openItemPath(downloadedPath)}>
                  {t('downloader.openFolder')}
                </button>
              )}
              <button className="primary-btn" onClick={onClose}>
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
            <p className="error-message">{error}</p>
            <button className="primary-btn" onClick={() => setState('input')}>
              {t('common.cancel')}
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
              <button className="close-btn" onClick={onClose}>
                <X size={ICON_SIZES.MEDIUM} />
              </button>
            )}
          </div>

          <div className="modal-body">
            {renderContent()}
          </div>
        </div>
      </div>

      {showEditMetadata && (
        <EditModal
          isOpen={true}
          type="song"
          data={{
            title: videoInfo.title,
            artist: videoInfo.artist,
            album: videoInfo.album,
            coverArt: videoInfo.thumbnail,
          }}
          onClose={() => setShowEditMetadata(false)}
          onSave={handleUpdateMetadata}
        />
      )}
    </>
  );
};
