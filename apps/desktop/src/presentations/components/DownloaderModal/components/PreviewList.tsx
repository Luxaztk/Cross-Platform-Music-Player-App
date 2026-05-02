import React from 'react';
import { DownloadPreviewCard, DuplicateWarningBanner } from '@components';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

interface PreviewListProps {
  items: DownloadItem[];
  downloadState: string;
  duplicateInfo?: any;
  downloadError?: string | null;
  onItemClick?: (item: DownloadItem) => void;
  t: (key: string, options?: any) => string;
}

export const PreviewList: React.FC<PreviewListProps> = ({
  items,
  downloadState,
  duplicateInfo,
  downloadError,
  onItemClick,
  t
}) => {
  const isStatusView = downloadState === DOWNLOAD_STATUS.SUCCESS || downloadState === DOWNLOAD_STATUS.ERROR;
  const isSingleItem = items.length === 1;

  return (
    <div className="downloader-preview-state">
      <div className="preview-items-list">
        {items.map((item) => (
          <DownloadPreviewCard
            key={item.id}
            info={item}
            onClick={onItemClick ? () => onItemClick(item) : undefined}
          />
        ))}
      </div>

      {downloadState === DOWNLOAD_STATUS.PREVIEW && duplicateInfo && (
        <DuplicateWarningBanner duplicateInfo={duplicateInfo} />
      )}

      {isStatusView && isSingleItem && (
        <>
          {downloadState === DOWNLOAD_STATUS.SUCCESS && (
            <div className="downloader-status-state success" style={{ marginTop: '24px' }}>
              <CheckCircle2 size={48} className="status-icon" />
              <h3>{t('downloader.success')}</h3>
            </div>
          )}
          {downloadState === DOWNLOAD_STATUS.ERROR && (
            <div className="downloader-status-state error" style={{ marginTop: '24px' }}>
              <AlertCircle size={48} className="status-icon" />
              <h3>{t('downloader.error')}</h3>
              <p className="error-message">{downloadError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
