import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Download, Edit2, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Clipboard, ClipboardCheck } from 'lucide-react';
import type { Song, Playlist } from '@music/types';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import { useLibrary, useNotification } from '../../../application/hooks';
import { EditModal } from '../EditModal/EditModal';
import { getErrorMessage } from '@music/utils';
import './DownloaderModal.scss';

interface DownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'fetching' | 'preview' | 'downloading' | 'success' | 'error';

interface YouTubeVideoInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  duration: number;
}

export const DownloaderModal: React.FC<DownloaderModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { refreshLibrary, refreshPlaylists } = useLibrary();
  const { showNotification } = useNotification();

  // Gom nhóm các state liên quan đến Duplicate để quản lý tập trung
  const [state, setState] = useState<ModalState>('input');
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPasted, setIsPasted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditMetadata, setShowEditMetadata] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);

  const [duplicateInfo, setDuplicateInfo] = useState<{
    warning: { title: string; artist: string; reason?: string } | null;
    isAfterDownload: boolean;
    reasonAfterDownload: string | null;
  }>({ warning: null, isAfterDownload: false, reasonAfterDownload: null });

  const urlInputRef = useRef<HTMLInputElement>(null);

  // Reset Modal State
  useEffect(() => {
    if (isOpen) {
      setState('input');
      setUrl('');
      setError(null);
      setProgress(0);
      setVideoInfo(null);
      setDownloadedPath(null);
      setDuplicateInfo({ warning: null, isAfterDownload: false, reasonAfterDownload: null });

      // Focus input mà không dùng setTimeout nếu có thể, hoặc dùng requestAnimationFrame
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (state !== 'downloading') return;

    const unsubscribe = window.electronAPI.onDownloadProgress((data) => {
      if (data.url === url) setProgress(data.percent);
    });

    return () => unsubscribe();
  }, [state, url]);

  const handleError = useCallback((err: unknown) => {
    const msg = getErrorMessage(err);
    setError(msg);
    setState('error');
    console.error('[Downloader] Fatal:', msg);
  }, [t]);

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

    try {
      const result = await window.electronAPI.fetchYtInfo(url);
      if (!result.success || !result.info) {
        throw new Error(result.error || t('downloader.error'));
      }

      setVideoInfo(result.info);

      // Tách logic check trùng
      const dupCheck = await window.electronAPI.checkDuplicate(
        result.info.title,
        result.info.artist,
        url.trim(),
        result.info.id
      );

      if (dupCheck.isDuplicate && dupCheck.existingSong) {
        setDuplicateInfo(prev => ({
          ...prev,
          warning: {
            title: dupCheck.existingSong!.title,
            artist: dupCheck.existingSong!.artist,
            reason: dupCheck.reason as string,
          }
        }));
      }

      setState('preview');
    } catch (err) {
      handleError(err);
    }
  };

  const handleDownload = async (forceDownload = false) => {
    if (!videoInfo || (duplicateInfo.warning && !forceDownload)) return;

    setState('downloading');
    setProgress(0);

    try {
      const result = await window.electronAPI.downloadYtAudio(url, videoInfo.title);
      if (!result.success || !result.filePath) {
        throw new Error(result.error || t('downloader.error'));
      }

      // Ghi metadata (Sử dụng interface Partial<Song> an toàn chúng ta đã làm ở global.d.ts)
      await window.electronAPI.writeAudioMetadata(result.filePath, {
        title: videoInfo.title,
        artist: videoInfo.artist,
        album: videoInfo.album,
        coverArt: videoInfo.thumbnail, // Lưu ý: dùng đúng tên field trong Song
        originId: videoInfo.id,
        sourceUrl: url,
      });

      // Import và check trùng chốt hạ
      const importResult = await window.electronAPI.importFromPath(result.filePath, url, videoInfo.id);

      if (importResult.success && importResult.count === 0) {
        setDuplicateInfo(prev => ({
          ...prev,
          isAfterDownload: true,
          reasonAfterDownload: importResult.reason || null
        }));
      }

      await Promise.all([refreshLibrary(), refreshPlaylists()]);
      setDownloadedPath(result.filePath);
      setState('success');
    } catch (err) {
      handleError(err);
    }
  };

  const handleUpdateMetadata = (updatedData: Song | Playlist) => {
    if (!videoInfo) return;
    const updated = { ...videoInfo, ...updatedData };
    setVideoInfo(updated as YouTubeVideoInfo);
    setShowEditMetadata(false);

    // Re-check duplicate if title/artist changed
    window.electronAPI.checkDuplicate(updated.title, updated.artist, url, videoInfo.id).then((dupCheck) => {
      if (dupCheck.isDuplicate && dupCheck.existingSong) {
        setDuplicateInfo(prev => ({
          ...prev,
          warning: {
            title: dupCheck.existingSong!.title,
            artist: dupCheck.existingSong!.artist,
            reason: dupCheck.reason as string,
          }
        }));
      } else {
        setDuplicateInfo(prev => ({ ...prev, warning: null }));
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
                <img src={videoInfo?.thumbnail} alt={videoInfo?.title} />
              </div>
              <div className="video-details">
                <h3>{videoInfo?.title}</h3>
                <p>{videoInfo?.artist}</p>
                <span className="album-tag">{videoInfo?.album}</span>
              </div>
            </div>

            {/* === HIỂN THỊ CẢNH BÁO TRÙNG LẶP (Chốt 1) === */}
            {duplicateInfo.warning && (
              <div className="duplicate-warning">
                <AlertTriangle size={16} />
                <div>
                  <strong>{t('downloader.duplicateWarning')}</strong>
                  <p>
                    {duplicateInfo.warning.reason === 'URL'
                      ? t('downloader.duplicateSourceFound')
                      : t('downloader.duplicateFound')
                        .replace('{title}', duplicateInfo.warning.title)
                        .replace('{artist}', duplicateInfo.warning.artist)}
                  </p>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button className="secondary-btn" onClick={() => setShowEditMetadata(true)}>
                <Edit2 size={ICON_SIZES.TINY} />
                <span>{t('downloader.editMetadata')}</span>
              </button>
              {duplicateInfo.warning ? (
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

      case 'downloading': {
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
            <p className="song-title-scrolling">{videoInfo?.title}</p>
          </div>
        );
      }

      case 'success':
        return (
          <div className="downloader-status-state success">
            <CheckCircle2 size={64} className="status-icon" />
            <h3>{t('downloader.success')}</h3>

            {/* Thông báo nếu bị trùng sau khi tải (Chốt 2) */}
            {duplicateInfo.isAfterDownload && (
              <div className="duplicate-info-banner">
                <AlertTriangle size={14} />
                <span>
                  {duplicateInfo.reasonAfterDownload === 'HASH'
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

      {showEditMetadata && videoInfo && (
        <EditModal
          isOpen={true}
          type="song"
          data={{
            title: videoInfo.title,
            artist: videoInfo.artist,
            album: videoInfo.album,
            coverArt: videoInfo.thumbnail,
          } as any}
          onClose={() => setShowEditMetadata(false)}
          onSave={handleUpdateMetadata}
        />
      )}
    </>
  );
};

export default DownloaderModal;
