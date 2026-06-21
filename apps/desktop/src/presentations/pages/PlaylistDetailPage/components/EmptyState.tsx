import React from 'react';
import { UploadCloud, Folder, FileMusic, Loader2 } from 'lucide-react';
import { useLanguage } from '@hooks';
import './EmptyState.scss';

interface EmptyStateProps {
  onImportFiles?: () => Promise<void>;
  onImportFolder?: () => Promise<void>;
  isImporting?: boolean;
  t?: (key: string, options?: Record<string, string | number>) => string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onImportFiles,
  onImportFolder,
  isImporting
}) => {
  const { t } = useLanguage();

  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        <div className="icon-wrapper">
          <UploadCloud size={48} />
        </div>
        <h3>{t ? t('playlist.emptyStateTitle') : 'Kéo thả thư mục nhạc của bạn vào đây để bắt đầu'}</h3>
        <p className="subtitle">{t ? t('playlist.emptyStateSubtitle') : 'Hoặc sử dụng các nút bên dưới để chọn file thủ công'}</p>

        <div className="action-buttons">
          {isImporting ? (
            <button className="import-btn primary merged-loading" disabled style={{ width: '100%', justifyContent: 'center' }}>
              <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
              {t ? t('playlist.processingData') : 'Đang xử lý dữ liệu...'}
            </button>
          ) : (
            <>
              <button className="import-btn primary" onClick={onImportFiles}>
                <FileMusic size={18} />
                {t ? t('playlist.importFiles') : 'Thêm File'}
              </button>
              <button className="import-btn secondary" onClick={onImportFolder}>
                <Folder size={18} />
                {t ? t('playlist.importFolder') : 'Thêm Thư mục'}
              </button>
            </>
          )}
        </div>

        <div className="microcopy-tip">
          {t ? t('playlist.emptyStateTip') : '💡 Mẹo: Bạn có thể chọn hàng loạt bài hát bằng cách giữ phím Shift hoặc Ctrl giống như trong File Explorer.'}
        </div>
      </div>
    </div>
  );
};
