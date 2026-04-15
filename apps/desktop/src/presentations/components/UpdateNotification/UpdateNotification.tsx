import { useEffect, useState } from 'react';
import './UpdateNotification.scss';

export function UpdateNotification() {
  const [show, setShow] = useState(false);
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    // ==========================================
    // KHU VỰC MOCK DATA CHO MÔI TRƯỜNG DEV (CHỈ CHẠY KHI NPM RUN DEV)
    // ==========================================
    if (import.meta.env.DEV) {
      // 1. Sau 2 giây mở app, giả vờ báo có bản cập nhật
      const mockStart = setTimeout(() => {
        setVersion('v9.9.9 (Dev Mock)');
        setShow(true);

        // 2. Tạo hiệu ứng % chạy mượt mà như đang tải thật
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
          currentProgress += Math.floor(Math.random() * 15) + 5; // Tăng ngẫu nhiên 5-20%

          if (currentProgress >= 100) {
            currentProgress = 100;
            setProgress(currentProgress);
            setIsDownloaded(true); // 3. Báo tải xong
            clearInterval(progressInterval);
          } else {
            setProgress(currentProgress);
          }
        }, 600); // Mỗi 0.6s cập nhật % một lần
      }, 2000);

      // Cleanup mock
      return () => clearTimeout(mockStart);
    }
    // ==========================================
    // KẾT THÚC KHU VỰC MOCK
    // ==========================================

    // Kịch bản thật (Chỉ có tác dụng khi chạy file .exe)
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
      <h3 className="title">{isDownloaded ? 'Cập nhật sẵn sàng!' : 'Đang tải bản cập nhật...'}</h3>
      <p className="version">Phiên bản: {version}</p>

      {!isDownloaded && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div className="actions">
        {!isDownloaded ? (
          <span className="status-text">Đang tải ngầm: {progress}%</span>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => setShow(false)}>
              Để sau
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                // Mock nút click trong lúc dev
                if (import.meta.env.DEV) {
                  alert('Chức năng khởi động lại chỉ hoạt động ở bản build .exe!');
                  setShow(false);
                } else {
                  window.electronAPI.restartApp();
                }
              }}
            >
              Khởi động lại ngay
            </button>
          </>
        )}
      </div>
    </div>
  );
}
