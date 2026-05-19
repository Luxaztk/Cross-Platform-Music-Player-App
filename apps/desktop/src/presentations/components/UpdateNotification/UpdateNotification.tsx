import { useEffect, useState } from 'react';
import { useLanguage } from '@hooks';
import './UpdateNotification.scss';

export function UpdateNotification() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    // Lắng nghe các sự kiện từ Electron (Hoạt động cả ở bản thật và bản Mock trong Dev)
    const removeAvailableListener = window.electronAPI.onUpdateAvailable((ver: string) => {
      setVersion(ver);
      setShow(true);
    });

    const removeProgressListener = window.electronAPI.onUpdateProgress((percent: number) => {
      setProgress(Math.round(percent));
    });

    const removeDownloadedListener = window.electronAPI.onUpdateDownloaded(() => {
      setIsDownloaded(true);
    });

    return () => {
      if (removeAvailableListener) removeAvailableListener();
      if (removeProgressListener) removeProgressListener();
      if (removeDownloadedListener) removeDownloadedListener();
    };
  }, []);

  if (!show) return null;

  return (
    <div className="update-notification">
      <h3 className="title">{isDownloaded ? t('update.ready') : t('update.downloading')}</h3>
      <p className="version">{t('update.version', { version })}</p>

      {!isDownloaded && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div className="actions">
        {!isDownloaded ? (
          <span className="status-text">{t('update.downloadingSilent', { progress })}</span>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => setShow(false)}>
              {t('update.later')}
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                // Mock nút click trong lúc dev
                if (import.meta.env.DEV) {
                  alert(t('update.devRestartWarning'));
                  setShow(false);
                } else {
                  window.electronAPI.restartApp();
                }
              }}
            >
              {t('update.restartNow')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
